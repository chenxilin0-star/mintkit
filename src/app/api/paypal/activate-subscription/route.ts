import { NextRequest, NextResponse } from 'next/server';

// POST /api/paypal/activate-subscription
// PayPal is no longer supported
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'PayPal is no longer supported. Please use Paddle to upgrade.' },
    { status: 503 }
  );
}
