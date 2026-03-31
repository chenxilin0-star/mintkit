import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAccessToken } from '../create-subscription/route';
import { getUserById, getOrCreateUser, upsertSubscription, updateUserPlan } from '@/lib/db';
import crypto from 'crypto';

export const runtime = 'nodejs';

function getPayPalBase(): string {
  return process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

// POST /api/paypal/activate-subscription
// Called after user returns from PayPal approval.
// Verifies subscription status with PayPal and updates DB.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { subscriptionId } = await req.json() as { subscriptionId: string };
    if (!subscriptionId) {
      return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });
    }

    // Query PayPal for subscription details
    const accessToken = await getAccessToken();
    const subRes = await fetch(`${getPayPalBase()}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!subRes.ok) {
      const err = await subRes.text();
      console.error('[activate-subscription] PayPal fetch failed:', err);
      return NextResponse.json({ error: 'Failed to verify subscription with PayPal' }, { status: 500 });
    }

    const subData = await subRes.json();
    const status = subData.status as string;
    const planId = subData.plan_id as string;

    // Only activate if subscription is ACTIVE or APPROVED
    if (status !== 'ACTIVE' && status !== 'APPROVED') {
      return NextResponse.json({
        error: `Subscription status is ${status}, not active. Please try again or contact support.`,
      }, { status: 400 });
    }

    // Determine plan from PayPal plan ID
    const plan = planId === process.env.PAYPAL_PREMIUM_PLAN_ID
      ? 'premium'
      : planId === process.env.PAYPAL_BASIC_PLAN_ID
        ? 'basic'
        : null;

    if (!plan) {
      console.error('[activate-subscription] Unknown PayPal plan ID:', planId);
      return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
    }

    // Update D1 database
    const userId = session.user.id;
    const email = session.user.email || '';
    const name = session.user.name || null;
    const avatar = session.user.image || null;

    // Ensure user exists in DB (required for FK constraint on subscriptions)
    const existingUser = await getUserById(userId);
    if (!existingUser) {
      await getOrCreateUser(userId, email, name, avatar);
      console.log(`[activate-subscription] Created user ${userId} in DB`);
    }

    // Upsert subscription record
    const nextBillingTime = subData.billing_info?.next_billing_time || '';
    await upsertSubscription({
      id: crypto.randomUUID(),
      user_id: userId,
      plan: plan as 'basic' | 'premium',
      status: 'active',
      paypal_subscription_id: subscriptionId,
      current_period_end: nextBillingTime,
    });

    // Update user plan
    await updateUserPlan(userId, plan as 'basic' | 'premium');

    console.log(`[activate-subscription] User ${userId} upgraded to ${plan}`);

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    console.error('[POST /api/paypal/activate-subscription]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
