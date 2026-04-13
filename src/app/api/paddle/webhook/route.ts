import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { upsertSubscription, updateUserPlan, updateSubscriptionStatus, getOrCreateUser, dbQuery } from '@/lib/db';
import { Plan } from '@/lib/subscription';

export const runtime = 'nodejs';

// Paddle webhook events we handle
type PaddleEventType =
  | 'subscription.activated'
  | 'subscription.canceled'
  | 'subscription.past_due'
  | 'subscription.updated';

interface PaddleEvent {
  id: string;
  event_type: PaddleEventType;
  data: {
    id: string;
    status?: string;
    custom_data?: {
      user_id?: string;
    };
    recurring_price_details?: {
      price_id?: string;
    };
    current_billing_period?: {
      ends_at?: string;
    };
  };
}

// Verify Paddle webhook signature
function verifyPaddleSignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const [timestamp, hash] = signature.split(',');
    if (!timestamp || !hash) return false;

    const timestampNum = parseInt(timestamp.replace('t=', ''), 10);
    const expectedHash = hash.replace('h1=', '');

    // Check timestamp is within 5 minutes
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestampNum) > 300) {
      console.warn('[Paddle Webhook] Signature timestamp too old');
      return false;
    }

    // Compute expected signature
    const payload = `${timestampNum}:${rawBody}`;
    const computedHash = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison
    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');

    if (expectedBuffer.length !== computedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, computedBuffer);
  } catch (err) {
    console.error('[Paddle Webhook] Signature verification error:', err);
    return false;
  }
}

// Map Paddle price ID to plan
function getPlanFromPriceId(priceId: string): 'basic' | 'premium' | null {
  const priceToPlan: Record<string, 'basic' | 'premium'> = {
    'pri_01kp2fdn1v4q8pnfejmn18h1ts': 'basic',
    'pri_01kp2fdnbywbvw3vdc2xv52tkc': 'premium',
  };
  return priceToPlan[priceId] || null;
}

// GET subscription by paddle ID
async function getSubscriptionByPaddleId(paddleId: string) {
  const subs = await dbQuery<{ user_id: string; paddle_subscription_id: string }>(
    'SELECT user_id, paddle_subscription_id FROM subscriptions WHERE paddle_subscription_id = ?',
    [paddleId]
  );
  return subs[0];
}

// POST /api/paddle/webhook
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('Paddle-Signature') || '';
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

  let event: PaddleEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = event.event_type;
  console.log(`[Paddle Webhook] Event: ${eventType}, ID: ${event.id}`);

  // Verify signature if secret is configured
  if (webhookSecret) {
    const isValid = verifyPaddleSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.warn('[Paddle Webhook] Signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }
  } else {
    console.warn('[Paddle Webhook] No PADDLE_WEBHOOK_SECRET configured, skipping verification');
  }

  // Guard: skip DB operations if D1 is not configured
  const isD1Configured = !!(process.env.CLOUDFLARE_D1_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID);

  try {
    const subscriptionId = event.data.id;
    const customData = event.data.custom_data || {};
    const userId = customData.user_id;

    switch (eventType) {
      case 'subscription.activated': {
        if (!isD1Configured) {
          console.warn('[Paddle Webhook] D1 not configured — skipping DB update');
          break;
        }

        // Determine plan from price ID in the event
        const priceId = event.data.recurring_price_details?.price_id;
        const plan = priceId ? getPlanFromPriceId(priceId) : null;

        if (!plan) {
          console.warn('[Paddle Webhook] Could not determine plan from event');
          break;
        }

        if (!userId) {
          console.warn('[Paddle Webhook] No user_id in custom_data — skipping subscription upsert');
          break;
        }

        try {
          // Ensure user exists
          const dbUser = await getOrCreateUser(userId, '', null, null);
          if (!dbUser) {
            console.error(`[Paddle Webhook] getOrCreateUser returned null for ${userId}`);
            break;
          }

          const currentPeriodEnd = event.data.current_billing_period?.ends_at || '';

          await upsertSubscription({
            id: crypto.randomUUID(),
            user_id: userId,
            plan: plan as 'basic' | 'premium',
            status: 'active',
            paddle_subscription_id: subscriptionId,
            current_period_end: currentPeriodEnd,
          });

          await updateUserPlan(userId, plan as Plan);
          console.log(`[Paddle Webhook] Subscription activated: ${subscriptionId} for user ${userId}, plan ${plan}`);
        } catch (dbErr: any) {
          console.error('[Paddle Webhook] DB error during activation:', dbErr.message);
        }
        break;
      }

      case 'subscription.canceled': {
        if (!isD1Configured) {
          console.warn('[Paddle Webhook] D1 not configured — skipping DB update');
          break;
        }

        try {
          const sub = await getSubscriptionByPaddleId(subscriptionId);
          if (sub && sub.user_id) {
            await updateUserPlan(sub.user_id, 'free');
            await updateSubscriptionStatus(subscriptionId, 'cancelled');
            console.log(`[Paddle Webhook] Subscription cancelled: ${subscriptionId}`);
          }
        } catch (dbErr: any) {
          console.error('[Paddle Webhook] DB error during cancellation:', dbErr.message);
        }
        break;
      }

      case 'subscription.past_due': {
        if (!isD1Configured) {
          console.warn('[Paddle Webhook] D1 not configured — skipping DB update');
          break;
        }

        try {
          const sub = await getSubscriptionByPaddleId(subscriptionId);
          if (sub && sub.user_id) {
            await updateUserPlan(sub.user_id, 'free');
            await updateSubscriptionStatus(subscriptionId, 'past_due');
            console.log(`[Paddle Webhook] Subscription past_due: ${subscriptionId}`);
          }
        } catch (dbErr: any) {
          console.error('[Paddle Webhook] DB error during past_due:', dbErr.message);
        }
        break;
      }

      case 'subscription.updated': {
        if (!isD1Configured) {
          console.warn('[Paddle Webhook] D1 not configured — skipping DB update');
          break;
        }

        // Handle plan changes or status updates
        const newStatus = event.data.status;
        if (newStatus) {
          try {
            await updateSubscriptionStatus(subscriptionId, newStatus);
            console.log(`[Paddle Webhook] Subscription updated: ${subscriptionId}, status: ${newStatus}`);
          } catch (dbErr: any) {
            console.error('[Paddle Webhook] DB error during update:', dbErr.message);
          }
        }
        break;
      }

      default:
        console.log(`[Paddle Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[POST /api/paddle/webhook]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
