import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '../create-subscription/route';
import { upsertSubscription, updateUserPlan, getUserById, getOrCreateUser } from '@/lib/db';
import { Plan } from '@/lib/subscription';
import crypto from 'crypto';

export const runtime = 'nodejs';

// POST /api/paypal/webhook — receives PayPal webhook events
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('paypal-transmission-sig') || '';
  const certUrl = req.headers.get('paypal-cert-url') || '';
  const transmissionId = req.headers.get('paypal-transmission-id') || '';
  const transmissionTime = req.headers.get('paypal-transmission-time') || '';
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const webhookSecret = process.env.PAYPAL_WEBHOOK_ID; // Same as webhookId

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = event.event_type as string;
  console.log(`[PayPal Webhook] Event: ${eventType}`);

  try {
    // Verify webhook signature
    if (webhookId && process.env.PAYPAL_CLIENT_ID) {
      const isValid = await verifyPayPalWebhook({
        rawBody,
        transmissionId,
        transmissionTime,
        certUrl,
        signature,
        webhookId,
      });
      if (!isValid) {
        console.warn('[PayPal Webhook] Signature verification failed');
        // For development, you may want to skip this check
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }
      }
    }

    const resource = event.resource as Record<string, unknown>;
    const paypalSubId = resource.id as string;
    const customId = resource.custom_id as string;
    const planId = resource.plan_id as string;

    // Guard: skip DB operations if D1 is not configured
    const isD1Configured = !!(process.env.CLOUDFLARE_D1_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID);

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.CREATED': {
        // Determine plan from PayPal plan ID
        const plan = planId === process.env.PAYPAL_PREMIUM_PLAN_ID
          ? 'premium'
          : planId === process.env.PAYPAL_BASIC_PLAN_ID
            ? 'basic'
            : null;

        if (!plan) {
          console.warn('[PayPal Webhook] Unknown plan ID:', planId);
          break;
        }

        if (isD1Configured) {
          // Ensure user exists in DB
          if (customId) {
            const existingUser = await getUserById(customId);
            if (!existingUser) {
              console.warn('[PayPal Webhook] User not found in DB:', customId);
              break;
            }
          }

          await upsertSubscription({
            id: crypto.randomUUID(),
            user_id: customId || '',
            plan: plan as 'basic' | 'premium',
            status: 'active',
            paypal_subscription_id: paypalSubId,
            current_period_end: (resource.billing_info as Record<string, string>)?.next_billing_time || '',
          });

          if (customId) {
            await updateUserPlan(customId, plan as Plan);
          }
        } else {
          console.warn('[PayPal Webhook] D1 not configured — skipping DB update for subscription:', paypalSubId);
        }

        console.log(`[PayPal Webhook] Subscription activated: ${paypalSubId} for plan ${plan}`);
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        if (isD1Configured) {
          const sub = await getSubscriptionByPaypalId(paypalSubId);
          if (sub && sub.user_id) {
            await updateUserPlan(sub.user_id, 'free');
            await updateSubscriptionStatus(paypalSubId, 'cancelled');
          }
        }
        console.log(`[PayPal Webhook] Subscription cancelled: ${paypalSubId}`);
        break;
      }

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        if (isD1Configured) {
          const sub = await getSubscriptionByPaypalId(paypalSubId);
          if (sub && sub.user_id) {
            await updateUserPlan(sub.user_id, 'free');
            await updateSubscriptionStatus(paypalSubId, 'past_due');
          }
        }
        console.log(`[PayPal Webhook] Payment failed: ${paypalSubId}`);
        break;
      }

      default:
        console.log(`[PayPal Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[POST /api/paypal/webhook]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── Webhook verification ──────────────────────────────────────────────────

interface VerifyParams {
  rawBody: string;
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  signature: string;
  webhookId: string;
}

async function verifyPayPalWebhook(params: VerifyParams): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();
    const res = await fetch(`${process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: 'SHA256withRSA',
        cert_url: params.certUrl,
        transmission_id: params.transmissionId,
        transmission_sig: params.signature,
        transmission_time: params.transmissionTime,
        webhook_id: params.webhookId,
        webhook_event: JSON.parse(params.rawBody),
      }),
    });
    const data = await res.json();
    return data.verification_status === 'SUCCESS';
  } catch {
    return false;
  }
}

// ─── Helpers (need DB) ──────────────────────────────────────────────────────

async function getSubscriptionByPaypalId(paypalId: string) {
  const { dbQuery } = await import('@/lib/db');
  const subs = await dbQuery<{ user_id: string }>(
    'SELECT user_id FROM subscriptions WHERE paypal_subscription_id = ?',
    [paypalId]
  );
  return subs[0];
}

async function updateSubscriptionStatus(paypalId: string, status: string) {
  const { dbExec } = await import('@/lib/db');
  await dbExec(
    "UPDATE subscriptions SET status = ? WHERE paypal_subscription_id = ?",
    [status, paypalId]
  );
}
