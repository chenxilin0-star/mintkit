import { initializePaddle } from '@paddle/paddle-js';

let paddleClient: ReturnType<typeof initializePaddle> | null = null;

export function getPaddleServer(): ReturnType<typeof initializePaddle> {
  if (!paddleClient) {
    paddleClient = initializePaddle({ 
      token: process.env.PADDLE_CLIENT_TOKEN!,
      environment: 'production', 
    });
  }
  return paddleClient;
}
