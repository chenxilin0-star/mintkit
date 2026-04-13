'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PLANS, Plan, canUpgradeTo, buildUserPlanInfo, getPlanColor, getPlanLabel } from '@/lib/subscription';
import { initPaddle } from '@/lib/paddle-client';

const PRICE_IDS: Record<string, string> = {
  basic: 'pri_01kp2fdn1v4q8pnfejmn18h1ts',
  premium: 'pri_01kp2fdnbywbvw3vdc2xv52tkc',
};

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: Plan;
  reason?: 'download' | 'copy' | 'limit' | 'manual';
  todayCount?: number;
  monthlyCount?: number;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  currentPlan = 'free',
  reason = 'manual',
  todayCount = 0,
  monthlyCount = 0,
}: UpgradeModalProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const reasonMessages: Record<string, { title: string; body: string }> = {
    download: {
      title: '📥 Download Available for Paid Plans',
      body: 'Upgrade to Basic or Premium to download your generated product as a PDF.',
    },
    copy: {
      title: '📋 Copy Available for Paid Plans',
      body: 'Upgrade to Basic or Premium to copy your generated content to clipboard.',
    },
    limit: {
      title: '⏱️ Generation Limit Reached',
      body: "You've reached your daily generation limit. Upgrade for more generations!",
    },
    manual: {
      title: '🚀 Unlock Full Access',
      body: 'Upgrade your plan to get more generations, PDF downloads, and priority processing.',
    },
  };

  async function handleUpgrade(plan: Plan) {
    if (status !== 'authenticated') {
      // Redirect to sign in first
      router.push('/api/auth/signin');
      return;
    }

    if (plan === 'free') {
      onClose();
      return;
    }

    setLoading(plan);
    setError('');

    try {
      const res = await fetch('/api/paddle/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error?.includes('not configured')) {
          setError('Paddle is not configured yet. Please contact support or try again later.');
        } else {
          setError(data.error || 'Failed to create subscription');
        }
        return;
      }

      // Initialize Paddle.js and open checkout
      if (data.clientToken) {
        const paddle = await initPaddle(data.clientToken);
        if (paddle) {
          paddle.Checkout.open({
            items: [{ priceId: PRICE_IDS[plan] }],
            customData: { user_id: session.user.id },
            customer: {
              email: session?.user?.email || undefined,
            },
          });
        }
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(null);
    }
  }

  const planInfo = buildUserPlanInfo(currentPlan, todayCount, monthlyCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-5 flex items-start justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {reasonMessages[reason]?.title || reasonMessages.manual.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {reasonMessages[reason]?.body || reasonMessages.manual.body}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 ml-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Current usage */}
        {currentPlan !== 'free' && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs text-gray-500">
              Your current plan: <span className={`font-medium px-1.5 py-0.5 rounded-full text-xs ${getPlanColor(currentPlan)}`}>{getPlanLabel(currentPlan)}</span>
              {' · '}
              {currentPlan === 'basic' ? (
                <>{monthlyCount}/30 generations this month</>
              ) : (
                <>Unlimited generations</>
              )}
            </p>
          </div>
        )}

        {/* Plans */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              const isHighlighted = plan.highlighted;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 p-5 flex flex-col transition-all ${
                    isHighlighted
                      ? 'border-amber-400 bg-gradient-to-b from-amber-50 to-white shadow-md ring-2 ring-amber-100'
                      : isCurrent
                        ? 'border-emerald-400 bg-emerald-50/30'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        ⭐ Most Popular
                      </span>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        ✓ Current Plan
                      </span>
                    </div>
                  )}

                  <div className="mb-4 pt-2">
                    <h3 className="font-bold text-gray-900 text-base">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-gray-900">{plan.priceLabel}</span>
                      {plan.price !== null && (
                        <span className="text-gray-400 text-sm">/month</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                  </div>

                  <ul className="flex-1 space-y-2 mb-5">
                    {plan.features.map((feature, i) => {
                      const isPositive = !feature.startsWith('❌');
                      return (
                        <li key={i} className={`text-sm flex items-start gap-2 ${isPositive ? 'text-gray-700' : 'text-gray-400'}`}>
                          <span className="shrink-0 mt-0.5">{isPositive ? '✅' : '➖'}</span>
                          <span>{feature.replace(/^[✅➖]\s*/, '')}</span>
                        </li>
                      );
                    })}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrent || loading !== null || (currentPlan !== 'free' && !canUpgradeTo(currentPlan, plan.id))}
                    className={`w-full min-h-[44px] py-3 rounded-xl font-semibold text-sm transition-colors ${
                      isCurrent
                        ? 'bg-gray-100 text-gray-400 cursor-default'
                        : currentPlan !== 'free' && !canUpgradeTo(currentPlan, plan.id)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : isHighlighted
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    } ${loading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Redirecting...
                      </span>
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : currentPlan !== 'free' && !canUpgradeTo(currentPlan, plan.id) ? (
                      'Included in Your Plan'
                    ) : (
                      plan.cta
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-5">
            💳 Powered by Paddle · Cancel anytime · Secure payment
          </p>
        </div>
      </div>
    </div>
  );
}
