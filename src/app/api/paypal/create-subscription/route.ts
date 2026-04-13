import { NextRequest, NextResponse } from 'next/server';

// POST /api/paypal/create-subscription
// PayPal is no longer supported - returns error
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'PayPal is no longer supported. Please use Paddle to upgrade.' },
    { status: 503 }
  );
}
