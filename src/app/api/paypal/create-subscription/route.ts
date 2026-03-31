import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserById, getActiveSubscription } from '@/lib/db';

export const runtime = 'nodejs';

const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com';
const PAYPAL_LIVE_BASE = 'https://api-m.paypal.com';

function getPayPalBase(): string {
  return process.env.PAYPAL_MODE === 'live' ? PAYPAL_LIVE_BASE : PAYPAL_API_BASE;
}

export async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) {
    throw new Error('PayPal credentials not configured');
  }

  const credentials = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const res = await fetch(`${getPayPalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

// POST /api/paypal/create-subscription
// Creates a PayPal subscription and returns the approval URL
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

    // Check if user already has an active subscription
    try {
      const user = await getUserById(session.user.id);
      if (user && (user.plan === 'basic' || user.plan === 'premium')) {
        const activeSub = await getActiveSubscription(session.user.id);
        if (activeSub && activeSub.status === 'active') {
          return NextResponse.json(
            { error: `You already have an active ${user.plan} subscription. Please cancel it first before subscribing to a new plan.` },
            { status: 409 }
          );
        }
      }
    } catch (dbErr: any) {
      // If D1 not configured, skip the check (dev mode)
      if (!dbErr.message?.includes('Missing CLOUDFLARE') && !dbErr.message?.includes('fetch failed')) {
        console.warn('[create-subscription] DB check failed, proceeding:', dbErr.message);
      }
    }

    const planId = plan === 'basic'
      ? process.env.PAYPAL_BASIC_PLAN_ID
      : process.env.PAYPAL_PREMIUM_PLAN_ID;

    if (!planId) {
      console.error('[create-subscription] Missing plan ID:', { basic: !!process.env.PAYPAL_BASIC_PLAN_ID, premium: !!process.env.PAYPAL_PREMIUM_PLAN_ID, plan });
      return NextResponse.json({ error: 'PayPal plan not configured. Please add PAYPAL_BASIC_PLAN_ID and PAYPAL_PREMIUM_PLAN_ID to your environment variables.' }, { status: 503 });
    }

    const accessToken = await getAccessToken();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mintkit.vercel.app';

    const subscriptionRes = await fetch(`${getPayPalBase()}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `${session.user.id}-${Date.now()}`,
      },
      body: JSON.stringify({
        plan_id: planId,
        subscriber: {
          email_address: session.user.email,
        },
        application_context: {
          brand_name: 'MintKit',
          landing_page: 'BILLING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${baseUrl}/subscription?success=1`,
          cancel_url: `${baseUrl}/subscription?cancelled=1`,
        },
        custom_id: session.user.id, // Pass userId for webhook correlation
      }),
    });

    if (!subscriptionRes.ok) {
      const err = await subscriptionRes.text();
      console.error('[PayPal create subscription error]', err);
      return NextResponse.json({ error: 'Failed to create PayPal subscription', details: err }, { status: 500 });
    }

    const subscription = await subscriptionRes.json();
    // Find the approval URL
    const approvalLink = subscription.links?.find((l: { rel: string }) => l.rel === 'approve');
    if (!approvalLink) {
      return NextResponse.json({ error: 'No approval URL in PayPal response' }, { status: 500 });
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      approvalUrl: approvalLink.href,
    });
  } catch (err: any) {
    console.error('[POST /api/paypal/create-subscription]', err);
    if (err.message?.includes('PayPal credentials not configured')) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
