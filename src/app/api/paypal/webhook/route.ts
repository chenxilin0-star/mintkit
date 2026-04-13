import { NextRequest, NextResponse } from 'next/server';

// POST /api/paypal/webhook — PayPal is no longer supported
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'PayPal is no longer supported.' },
    { status: 503 }
  );
}
