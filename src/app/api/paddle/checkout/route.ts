import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserById, getActiveSubscription } from '@/lib/db';

export const runtime = 'nodejs';

const PADDLE_API_BASE = 'https://api.paddle.com';

// Paddle Price IDs
const PADDLE_PRICES: Record<string, string> = {
  basic: 'pri_01kp2fdn1v4q8pnfejmn18h1ts',
  premium: 'pri_01kp2fdnbywbvw3vdc2xv52tkc',
};

// POST /api/paddle/checkout
// Creates a Paddle checkout link and returns the URL
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

    const priceId = PADDLE_PRICES[plan];
    if (!priceId) {
      return NextResponse.json({ error: 'Paddle price not configured' }, { status: 503 });
    }

    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Paddle is not configured yet. Please contact support or try again later.' }, { status: 503 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mintkit.vercel.app';

    // Create Paddle payment link
    const response = await fetch(`${PADDLE_API_BASE}/payments/payment-links`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        custom_data: {
          user_id: session.user.id,
        },
        return_url: `${baseUrl}/subscription?success=1`,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Paddle create checkout error]', err);
      return NextResponse.json({ error: 'Failed to create Paddle checkout' }, { status: 500 });
    }

    const data = await response.json();
    const checkoutUrl = data.data?.[0]?.url;

    if (!checkoutUrl) {
      return NextResponse.json({ error: 'No checkout URL in Paddle response' }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl });
  } catch (err: any) {
    console.error('[POST /api/paddle/checkout]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
