import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// GET /api/paddle/client-token
// Returns the Paddle client token for frontend Paddle.js SDK initialization
export async function GET() {
  const clientToken = process.env.PADDLE_CLIENT_TOKEN;
  
  if (!clientToken) {
    return NextResponse.json({ error: 'Paddle not configured' }, { status: 503 });
  }
  
  return NextResponse.json({ clientToken });
}
