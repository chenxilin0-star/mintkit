import type { Metadata } from 'next';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
  title: 'Pricing - MintKit',
  description: 'Choose the plan that fits your digital product creation needs. Start free, upgrade anytime.',
};

export default function PricingPage() {
  return <PricingClient />;
}
