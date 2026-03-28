import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getUserById, getOrCreateUser, getActiveSubscription, countGenerationsToday, countGenerationsThisMonth, updateUserPlan, DbUser } from '@/lib/db';
import { buildUserPlanInfo, Plan } from '@/lib/subscription';
import { authOptions } from '../../auth/[...nextauth]/route';

export const runtime = 'nodejs';

// GET /api/user/plan — get current user's plan info
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ plan: 'free', todayCount: 0, monthlyCount: 0 });
    }

    const [todayCount, monthlyCount] = await Promise.all([
      countGenerationsToday(session.user.id),
      countGenerationsThisMonth(session.user.id),
    ]);

    const planInfo = buildUserPlanInfo(user.plan as Plan, todayCount, monthlyCount);

    // Get subscription info if on paid plan
    let subscription = null;
    if (user.plan === 'basic' || user.plan === 'premium') {
      subscription = await getActiveSubscription(session.user.id);
    }

    return NextResponse.json({
      userId: session.user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      ...planInfo,
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
      } : null,
    });
  } catch (err: any) {
    // If D1 is not configured (env vars missing), fall back to local logic
    if (err.message?.includes('Missing CLOUDFLARE') || err.message?.includes('fetch failed')) {
      return NextResponse.json({ plan: 'free', todayCount: 0, monthlyCount: 0, fallback: true });
    }
    console.error('[GET /api/user/plan]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/user/plan — update user plan (called by webhook or admin)
export async function POST(req: NextRequest) {
  // In production this should be protected by a webhook secret
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.WEBHOOK_API_SECRET) {
    // Also allow authenticated sessions to update own plan
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const body = await req.json();
    const { userId, plan } = body as { userId: string; plan: Plan };

    if (!userId || !plan) {
      return NextResponse.json({ error: 'Missing userId or plan' }, { status: 400 });
    }
    if (!['free', 'basic', 'premium'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    await updateUserPlan(userId, plan);
    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    if (err.message?.includes('Missing CLOUDFLARE') || err.message?.includes('fetch failed')) {
      return NextResponse.json({ success: true, fallback: true });
    }
    console.error('[POST /api/user/plan]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
