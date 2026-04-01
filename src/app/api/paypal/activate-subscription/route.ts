import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAccessToken } from '../create-subscription/route';
import { getUserById, getOrCreateUser, getActiveSubscription, upsertSubscription, updateUserPlan, updateSubscriptionStatus } from '@/lib/db';
import crypto from 'crypto';

export const runtime = 'nodejs';

function getPayPalBase(): string {
  return process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

/**
 * Cancel a PayPal subscription via API.
 * Used when upgrading from basic to premium to auto-cancel the old subscription.
 */
async function cancelPayPalSubscription(paypalSubId: string, accessToken: string, reason: string): Promise<boolean> {
  try {
    const res = await fetch(`${getPayPalBase()}/v1/billing/subscriptions/${paypalSubId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[cancelPayPalSubscription] Failed to cancel ${paypalSubId}:`, err);
      return false;
    }

    console.log(`[cancelPayPalSubscription] Successfully cancelled ${paypalSubId}: ${reason}`);
    return true;
  } catch (err) {
    console.error(`[cancelPayPalSubscription] Error cancelling ${paypalSubId}:`, err);
    return false;
  }
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
    let dbUser;
    try {
      dbUser = await getOrCreateUser(userId, email, name, avatar);
      if (!dbUser) {
        console.error(`[activate-subscription] getOrCreateUser returned null/undefined for ${userId}`);
        return NextResponse.json({ error: 'Failed to create user record. Please try again.' }, { status: 500 });
      }
      console.log(`[activate-subscription] User ${userId} ensured in DB, plan=${dbUser.plan}, email=${dbUser.email}`);
    } catch (dbErr: any) {
      console.error(`[activate-subscription] Failed to ensure user ${userId} in DB:`, dbErr.message);
      return NextResponse.json({ error: 'Failed to create user record. Please try again.' }, { status: 500 });
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

    // Auto-cancel old subscription if this is an upgrade (basic → premium)
    try {
      const oldSubs = await getActiveSubscription(userId);
      // Find old subscriptions that are not the current one
      // (getActiveSubscription returns the first active one, which might be the new one now)
      const { dbQuery } = await import('@/lib/db');
      const allActiveSubs = await dbQuery<{ paypal_subscription_id: string; plan: string }>(
        "SELECT paypal_subscription_id, plan FROM subscriptions WHERE user_id = ? AND status = 'active'",
        [userId]
      );
      for (const sub of allActiveSubs) {
        if (sub.paypal_subscription_id !== subscriptionId) {
          console.log(`[activate-subscription] Auto-cancelling old subscription ${sub.paypal_subscription_id} (${sub.plan}) for upgrade`);
          const cancelled = await cancelPayPalSubscription(
            sub.paypal_subscription_id,
            accessToken,
            `Upgrading to ${plan} plan`
          );
          if (cancelled) {
            await updateSubscriptionStatus(sub.paypal_subscription_id, 'cancelled');
          }
        }
      }
    } catch (cancelErr: any) {
      // Don't fail the activation if old subscription cancellation fails
      console.error('[activate-subscription] Failed to auto-cancel old subscription:', cancelErr.message);
    }

    // Update user plan
    await updateUserPlan(userId, plan as 'basic' | 'premium');

    console.log(`[activate-subscription] User ${userId} upgraded to ${plan}`);

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    console.error('[POST /api/paypal/activate-subscription]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
