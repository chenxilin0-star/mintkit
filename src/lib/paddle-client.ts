'use client';
import { initializePaddle, Paddle } from '@paddle/paddle-js';

let paddleInstance: Paddle | undefined = undefined;

export async function initPaddle(clientToken: string): Promise<Paddle | undefined> {
  if (!paddleInstance) {
    paddleInstance = await initializePaddle({
      token: clientToken,
      environment: 'production',
    });
  }
  return paddleInstance;
}

export function openCheckout(priceId: string, userId: string) {
  return paddleInstance?.Checkout.open({
    items: [{ priceId }],
    customData: { user_id: userId },
  });
}
