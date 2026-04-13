import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserById, getActiveSubscription } from '@/lib/db';

export const runtime = 'nodejs';

// POST /api/paddle/checkout
// Returns client token for Paddle.js frontend SDK
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { plan } = await req.json() as { plan: 'basic' | 'premium' };
    if (!['basic', 'premium'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Check if user already has an active subscription for the same or higher plan
    try {
      const user = await getUserById(session.user.id);
      if (user && (user.plan === 'basic' || user.plan === 'premium')) {
        const activeSub = await getActiveSubscription(session.user.id);
        if (activeSub && activeSub.status === 'active') {
          // Block if trying to subscribe to same or lower plan
          const tiers: Record<string, number> = { free: 0, basic: 1, premium: 2 };
          if (tiers[plan] <= tiers[user.plan]) {
            return NextResponse.json(
              { error: `You already have an active ${user.plan} subscription. Please cancel it first if you want to change plans.` },
              { status: 409 }
            );
          }
          console.log(`[paddle/checkout] Upgrade from ${user.plan} to ${plan}`);
        }
      }
    } catch (dbErr: any) {
      // If D1 not configured, skip the check (dev mode)
      if (!dbErr.message?.includes('Missing CLOUDFLARE') && !dbErr.message?.includes('fetch failed')) {
        console.warn('[paddle/checkout] DB check failed, proceeding:', dbErr.message);
      }
    }

    const clientToken = process.env.PADDLE_CLIENT_TOKEN;
    if (!clientToken) {
      return NextResponse.json({ error: 'Paddle is not configured yet. Please contact support or try again later.' }, { status: 503 });
    }

    // Return the client token - frontend will use Paddle.js SDK
    return NextResponse.json({ clientToken });
  } catch (err: any) {
    console.error('[POST /api/paddle/checkout]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
