'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';
import UpgradeModal from '@/components/UpgradeModal';
import { PLANS, Plan, canUpgradeTo, getPlanColor, getPlanLabel } from '@/lib/subscription';
import { initPaddle } from '@/lib/paddle-client';

const PRICE_IDS: Record<string, string> = {
  basic: 'pri_01kp2fdn1v4q8pnfejmn18h1ts',
  premium: 'pri_01kp2fdnbywbvw3vdc2xv52tkc',
};

export default function PricingClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<Plan>('free');
  const [dbFallback, setDbFallback] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/plan')
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) {
            setCurrentPlan(data.plan || 'free');
            if (data.fallback) {
              setDbFallback(true);
            }
          }
        })
        .catch(() => {});
    }
  }, [status]);

  async function handleUpgrade(plan: Plan) {
    if (plan === 'free') {
      setShowUpgrade(false);
      return;
    }
    if (status !== 'authenticated') {
      window.location.href = '/signin?callbackUrl=/pricing';
      return;
    }

    setLoading(plan);
    setError('');

    if (dbFallback) {
      setError('Database not configured. Cannot process upgrades right now. Please contact admin.');
      setLoading(null);
      return;
    }

    try {
      const res = await fetch('/api/paddle/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to start subscription');
        return;
      }
      // Initialize Paddle.js and open checkout
      if (data.clientToken && session?.user?.id) {
        const paddle = await initPaddle(data.clientToken);
        if (paddle) {
          paddle.Checkout.open({
            items: [{ priceId: PRICE_IDS[plan] }],
            customData: { user_id: session.user.id },
          });
        }
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Page header */}
        <div className="text-center mb-12">
          {dbFallback && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 text-center">
              ⚠️ Database not configured — plan changes cannot be saved. Contact admin.
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Simple, Transparent Pricing
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Start for free. Upgrade when you&apos;re ready to download and sell your digital products.
          </p>

          {session && currentPlan !== 'free' && (
            <div className="inline-flex items-center gap-2 mt-4 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2">
              <span className="text-sm text-emerald-700">
                Your current plan: <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${getPlanColor(currentPlan)}`}>{getPlanLabel(currentPlan)}</span>
              </span>
              <button
                onClick={() => router.push('/subscription')}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium underline"
              >
                Manage →
              </button>
            </div>
          )}
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isHighlighted = plan.highlighted;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-6 flex flex-col transition-all ${
                  isHighlighted
                    ? 'border-amber-400 bg-gradient-to-b from-amber-50 to-white shadow-xl ring-2 ring-amber-100'
                    : isCurrent
                      ? 'border-emerald-400 bg-emerald-50/30 shadow-lg'
                      : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-400 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                      ⭐ Most Popular
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                      ✓ Current Plan
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-5 pt-2">
                  <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">{plan.priceLabel}</span>
                    {plan.price !== null && (
                      <span className="text-gray-400 text-sm">/month</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 mb-5" />

                {/* Features */}
                <ul className="flex-1 space-y-3 mb-6">
                  {plan.features.map((feature, i) => {
                    const isPositive = !feature.startsWith('❌');
                    return (
                      <li key={i} className={`text-sm flex items-start gap-3 ${isPositive ? 'text-gray-700' : 'text-gray-400'}`}>
                        <span className="shrink-0 mt-0.5 text-base">{isPositive ? '✅' : '➖'}</span>
                        <span>{feature.replace(/^[✅➖]\s*/, '')}</span>
                      </li>
                    );
                  })}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => {
                    if (isCurrent) {
                      router.push('/subscription');
                    } else if (plan.id === 'free') {
                      router.push('/');
                    } else if (canUpgradeTo(currentPlan, plan.id)) {
                      handleUpgrade(plan.id);
                    }
                  }}
                  disabled={loading !== null || (currentPlan !== 'free' && !isCurrent && !canUpgradeTo(currentPlan, plan.id))}
                  className={`w-full min-h-[48px] py-3 rounded-xl font-semibold text-sm transition-all ${
                    isCurrent
                      ? 'bg-emerald-100 text-emerald-700 cursor-default hover:bg-emerald-100'
                      : currentPlan !== 'free' && !canUpgradeTo(currentPlan, plan.id)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isHighlighted
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg active:scale-95'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md active:scale-95'
                  } ${loading !== null ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Redirecting to Paddle...
                    </span>
                  ) : isCurrent ? (
                    'Manage Subscription'
                  ) : currentPlan !== 'free' && !canUpgradeTo(currentPlan, plan.id) ? (
                    currentPlan === 'premium' ? 'Current Plan' : 'Included in Your Plan'
                  ) : (
                    plan.cta
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* FAQ section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, i) => (
              <details key={i} className="bg-white rounded-xl border border-gray-100 p-5 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <span className="text-gray-400 group-open:rotate-45 transition-transform ml-4 shrink-0">✕</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border border-gray-100 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to get started?</h3>
          <p className="text-gray-500 mb-5">Join thousands of creators building digital products with AI.</p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
          >
            Generate Your First Product — Free
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center space-y-3">
          <div className="text-sm text-gray-400">
            Built with MintKit · 💳 Powered by Paddle · Cancel anytime
          </div>
          <div className="flex gap-4 text-sm text-gray-400 justify-center">
            <Link href="/terms-and-conditions" className="hover:text-gray-600 transition-colors">Terms & Conditions</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link href="/refund" className="hover:text-gray-600 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: 'How do I cancel my subscription?',
    a: "You can cancel your subscription anytime from the /subscription page. Go to your Dashboard → click your plan badge → Manage Subscription → Cancel. Your access will continue until the end of the current billing period.",
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We currently accept all major credit and debit cards through PayPal, including Visa, Mastercard, American Express, and Discover. PayPal account holders can also pay directly from their PayPal balance.',
  },
  {
    q: 'Can I get a refund?',
    a: "Yes, we offer a 7-day money-back guarantee for all paid plans. If you're not satisfied within the first 7 days, contact us and we'll process a full refund through PayPal.",
  },
  {
    q: 'What happens to my data?',
    a: 'Your data is stored securely and you retain full ownership of all generated products. We never share your data with third parties. You can request deletion of your account data at any time by contacting support.',
  },
  {
    q: 'How many generations do I get?',
    a: 'Free plan: 1 generation per day. Basic plan: 30 generations per month. Premium plan: unlimited generations. Generations reset on a daily (free) or monthly (basic) basis.',
  },
  {
    q: 'Do you offer yearly plans?',
    a: 'Yearly billing is coming soon! Yearly plans will offer approximately 2 months free compared to monthly billing. Stay tuned!',
  },
  {
    q: 'What are the differences between Basic and Premium?',
    a: 'Both Basic and Premium include PDF downloads and content copy. Premium adds priority generation queue (faster processing) and unlimited monthly generations. Basic is limited to 30 generations per month.',
  },
];
