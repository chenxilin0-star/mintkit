'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { PLANS, Plan, getPlanColor, getPlanLabel, buildUserPlanInfo } from '@/lib/subscription';

interface SubscriptionInfo {
  id: string;
  plan: 'basic' | 'premium';
  status: 'active' | 'cancelled' | 'past_due';
  currentPeriodEnd: string | null;
}

function SubscriptionContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPlan, setCurrentPlan] = useState<Plan>('free');
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [todayCount, setTodayCount] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const success = searchParams.get('success');
    if (success === '1') {
      // Paddle checkout completed - webhook will handle activation
      // Just show success message and refresh plan data
      setSuccess('🎉 Subscription activated! Welcome to MintKit.');
      fetchPlanData();
    }
    if (searchParams.get('cancelled') === '1') {
      setError('Checkout was cancelled. No charges were made.');
    }
  }, [searchParams]);

  async function fetchPlanData() {
    if (status !== 'authenticated') return;
    try {
      const res = await fetch('/api/user/plan');
      const data = await res.json();
      if (data && !data.error) {
        setCurrentPlan(data.plan || 'free');
        setTodayCount(data.todayCount || 0);
        setMonthlyCount(data.monthlyCount || 0);
        setSubscription(data.subscription);
      }
    } catch {}
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPlanData();
    }
  }, [status]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  async function handleUpgrade(plan: Plan) {
    if (plan === 'free') return;
    setLoading(plan);
    setError('');
    setSuccess('');
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
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(null);
    }
  }

  const planInfo = buildUserPlanInfo(currentPlan, todayCount, monthlyCount);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <span className="text-2xl">🌿</span>
          </div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const user = session?.user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
          <p className="text-gray-500 mt-1">Manage your MintKit plan and billing</p>
        </div>

        {/* Success / Error messages */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="text-emerald-700 text-sm font-medium">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Current plan card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Current Plan</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-2xl font-bold px-3 py-1 rounded-xl ${getPlanColor(currentPlan)}`}>
                  {getPlanLabel(currentPlan)}
                </span>
                {subscription?.status === 'active' && (
                  <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-full">
                    ● Active
                  </span>
                )}
                {subscription?.status === 'cancelled' && (
                  <span className="text-xs bg-gray-50 text-gray-500 border border-gray-100 px-2 py-1 rounded-full">
                    Cancelled
                  </span>
                )}
                {subscription?.status === 'past_due' && (
                  <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-full">
                    Past Due
                  </span>
                )}
              </div>
            </div>

            {/* Plan details */}
            <div className="text-right text-sm text-gray-500">
              {currentPlan === 'free' && <p>1 generation/day</p>}
              {currentPlan === 'basic' && <p>30 generations/month</p>}
              {currentPlan === 'premium' && <p>Unlimited</p>}
              {subscription?.currentPeriodEnd && (
                <p className="text-xs mt-1">
                  Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>

          {/* Usage */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{todayCount}</div>
              <div className="text-xs text-gray-500 mt-1">Generated today</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {currentPlan === 'premium' ? '∞' : monthlyCount}
                <span className="text-sm font-normal text-gray-400 ml-1">
                  / {currentPlan === 'premium' ? '' : currentPlan === 'basic' ? '30' : '—'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">This month</div>
            </div>
          </div>

          {/* Permissions */}
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <PermissionRow label="PDF Download" allowed={planInfo.canDownload} />
            <PermissionRow label="Copy Content" allowed={planInfo.canCopy} />
            <PermissionRow label="Priority Generation" allowed={planInfo.canPriority} />
          </div>
        </div>

        {/* Upgrade section */}
        {currentPlan !== 'premium' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {currentPlan === 'free' ? 'Upgrade Your Plan' : 'Upgrade to Premium'}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {currentPlan === 'free'
                ? 'Get more generations, PDF downloads, and content copy.'
                : 'Get unlimited generations and priority processing.'}
            </p>

            <div className="space-y-3">
              {PLANS.filter(p => {
                // Only show plans the user can upgrade to
                if (p.id === 'free') return false;
                if (p.id === currentPlan) return false;
                return true;
              }).map((plan) => (
                <div key={plan.id} className={`flex items-center justify-between p-4 rounded-xl border-2 ${plan.highlighted ? 'border-amber-300 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{plan.name}</span>
                      {plan.highlighted && (
                        <span className="text-xs bg-amber-400 text-white px-2 py-0.5 rounded-full font-medium">⭐ Best</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {plan.features.filter(f => !f.startsWith('❌')).length - 1} paid features · {plan.priceLabel}/month
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading !== null}
                    className={`min-h-[40px] px-5 py-2 rounded-xl font-semibold text-sm transition-colors ${
                      plan.highlighted
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    } ${loading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading === plan.id ? 'Redirecting...' : currentPlan === 'free' ? plan.cta : 'Upgrade Now'}
                  </button>
                </div>
              ))}
            </div>

            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          </div>
        )}

        {/* Cancel section */}
        {currentPlan !== 'free' && subscription?.status === 'active' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Cancel Subscription</h2>
            <p className="text-sm text-gray-500 mb-4">
              Your subscription will remain active until the end of the current billing period.
              After that, you&apos;ll revert to the Free plan.
            </p>
            <p className="text-xs text-gray-400">
              To cancel, please contact support at support@mintkit.com.
              Cancellation takes effect at the end of the billing period.
            </p>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-700">
                💡 Need help? Contact us at support@mintkit.com — we&apos;re happy to help!
              </p>
            </div>
          </div>
        )}

        {/* Billing info */}
        <div className="mt-6 text-center text-xs text-gray-400">
          💳 Billing powered by Paddle · Questions? Email support@mintkit.com
        </div>
      </main>
    </div>
  );
}

function PermissionRow({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={allowed ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
      <span className={allowed ? 'text-emerald-600' : 'text-gray-400'}>
        {allowed ? '✅ Included' : '➖ Not included'}
      </span>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <span className="text-2xl">🌿</span>
          </div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  );
}
