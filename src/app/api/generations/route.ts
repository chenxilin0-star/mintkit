import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getGenerations, createGeneration, countGenerationsToday, countGenerationsThisMonth, getUserById } from '@/lib/db';
import { buildUserPlanInfo, isOverDailyLimit, isOverMonthlyLimit, Plan } from '@/lib/subscription';

export const runtime = 'nodejs';

// GET /api/generations — get user's generation history
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const generations = await getGenerations(session.user.id, limit);
    const [todayCount, monthlyCount] = await Promise.all([
      countGenerationsToday(session.user.id),
      countGenerationsThisMonth(session.user.id),
    ]);
    const user = await getUserById(session.user.id);
    const plan = (user?.plan || 'free') as Plan;
    const planInfo = buildUserPlanInfo(plan, todayCount, monthlyCount);

    return NextResponse.json({ generations, ...planInfo });
  } catch (err: any) {
    if (err.message?.includes('Missing CLOUDFLARE') || err.message?.includes('fetch failed')) {
      return NextResponse.json({ generations: [], fallback: true });
    }
    console.error('[GET /api/generations]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/generations — record a new generation
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { niche, productTitle, productType, templateId } = body;

    if (!niche || !productTitle || !productType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check limits
    const [todayCount, monthlyCount] = await Promise.all([
      countGenerationsToday(session.user.id),
      countGenerationsThisMonth(session.user.id),
    ]);

    const user = await getUserById(session.user.id);
    const plan = (user?.plan || 'free') as Plan;

    if (isOverDailyLimit(plan, todayCount)) {
      return NextResponse.json({
        error: 'Daily limit reached',
        code: 'DAILY_LIMIT_EXCEEDED',
        ...buildUserPlanInfo(plan, todayCount, monthlyCount),
      }, { status: 429 });
    }

    if (isOverMonthlyLimit(plan, monthlyCount)) {
      return NextResponse.json({
        error: 'Monthly limit reached',
        code: 'MONTHLY_LIMIT_EXCEEDED',
        ...buildUserPlanInfo(plan, todayCount, monthlyCount),
      }, { status: 429 });
    }

    const id = crypto.randomUUID();
    await createGeneration({
      id,
      user_id: session.user.id,
      niche,
      product_title: productTitle,
      product_type: productType,
      template_id: templateId || 'modern',
    });

    const planInfo = buildUserPlanInfo(plan, todayCount + 1, monthlyCount + 1);
    return NextResponse.json({ success: true, generationId: id, ...planInfo });
  } catch (err: any) {
    if (err.message?.includes('Missing CLOUDFLARE') || err.message?.includes('fetch failed')) {
      // Fallback: allow generation without D1
      return NextResponse.json({ success: true, generationId: crypto.randomUUID(), fallback: true });
    }
    console.error('[POST /api/generations]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
