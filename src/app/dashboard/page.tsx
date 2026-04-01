'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import DashboardCard from '@/components/DashboardCard';
import {
  getUserProducts,
  deleteUserProduct,
  getUsageStats,
  getRecentProducts,
  UserProduct,
} from '@/lib/userProducts';
import { Plan, getPlanColor, getPlanLabel, buildUserPlanInfo } from '@/lib/subscription';
import UpgradeModal from '@/components/UpgradeModal';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({ todayCount: 0, monthCount: 0, totalCount: 0 });
  const [recentProducts, setRecentProducts] = useState<UserProduct[]>([]);
  const [mounted, setMounted] = useState(false);
  const [userPlan, setUserPlan] = useState<Plan>('free');
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Redirect to home if not logged in (after mount)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status === 'unauthenticated') {
      router.push('/');
    }
  }, [mounted, status, router]);

  // Load data when session is available
  useEffect(() => {
    if (status === 'authenticated') {
      setStats(getUsageStats());
      setRecentProducts(getRecentProducts(10));

      // Fetch plan info from API
      fetch('/api/user/plan')
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) {
            setUserPlan(data.plan || 'free');
          }
        })
        .catch(() => {});
    }
  }, [status]);

  function handleDelete(id: string) {
    deleteUserProduct(id);
    setStats(getUsageStats());
    setRecentProducts(getRecentProducts(10));
  }

  function handleRegenerate(product: UserProduct) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mintkit_regenerate_niche', product.niche);
    }
    router.push('/');
  }

  // Loading state
  if (!mounted || status === 'loading') {
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

  // Not logged in — let the redirect happen
  if (status === 'unauthenticated') {
    return null;
  }

  const user = session?.user;
  const planInfo = buildUserPlanInfo(userPlan, stats.todayCount, stats.monthCount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <img
              src={
                user?.image ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=10B981&color=fff&size=128`
              }
              alt={user?.name || 'User'}
              className="w-16 h-16 rounded-full border-2 border-emerald-100"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">{user?.name}</h2>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getPlanColor(userPlan)}`}>
                  {getPlanLabel(userPlan)}
                </span>
                {userPlan === 'premium' && (
                  <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
                    ⭐ Unlimited
                  </span>
                )}
                {userPlan === 'basic' && (
                  <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
                    30/month
                  </span>
                )}
                {userPlan === 'free' && (
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium underline"
                  >
                    Upgrade →
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="min-h-[36px] px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors whitespace-nowrap"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm text-center">
            <div className="text-3xl mb-1">📅</div>
            <div className="text-2xl font-bold text-gray-900">
              {userPlan === 'premium' ? '∞' : stats.todayCount}
              {userPlan === 'free' && <span className="text-sm font-normal text-gray-400"> /1</span>}
            </div>
            <div className="text-sm text-gray-500">
              {userPlan === 'free' ? 'today (1/day)' : 'today'}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm text-center">
            <div className="text-3xl mb-1">📆</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.monthCount}
              {userPlan === 'basic' && <span className="text-sm font-normal text-gray-400"> /30</span>}
              {userPlan === 'premium' && <span className="text-sm font-normal text-gray-400"> /∞</span>}
            </div>
            <div className="text-sm text-gray-500">This month</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm text-center">
            <div className="text-3xl mb-1">🚀</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalCount}</div>
            <div className="text-sm text-gray-500">Total generations</div>
          </div>
        </div>

        {/* Upgrade nudge for free users with low usage */}
        {userPlan === 'free' && stats.totalCount >= 3 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 text-center">
            <p className="text-amber-800 font-medium mb-1">🚀 You&apos;ve used MintKit {stats.totalCount} times!</p>
            <p className="text-sm text-amber-700 mb-3">
              Upgrade to Basic to download your PDFs and copy content — start selling today.
            </p>
            <button
              onClick={() => router.push('/pricing')}
              className="px-5 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors text-sm"
            >
              View Plans →
            </button>
          </div>
        )}

        {/* Generation History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Generation History</h2>
            {recentProducts.length > 0 && (
              <button
                onClick={() => router.push('/')}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                + New Product
              </button>
            )}
          </div>

          {recentProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Start by entering a niche on the homepage and generate your first digital product.
              </p>
              <button
                onClick={() => router.push('/')}
                className="min-h-[44px] px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
              >
                🚀 Generate Your First Product
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProducts.map((product) => (
                <DashboardCard
                  key={product.id}
                  product={product}
                  onDelete={handleDelete}
                  onRegenerate={handleRegenerate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="mt-10 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
          <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            💡 Tips to increase sales
          </h3>
          <ul className="text-sm text-amber-700 space-y-2">
            <li className="flex gap-2">
              <span className="text-amber-400 mt-0.5 shrink-0">•</span>
              <span>Use specific niches — &quot;French learning for kids 6-8&quot; converts better than &quot;language learning&quot;</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400 mt-0.5 shrink-0">•</span>
              <span>Try pricing at $9.99 or $14.99 — odd pricing psychology works on Gumroad</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400 mt-0.5 shrink-0">•</span>
              <span>Add a free preview PDF so customers can see quality before buying</span>
            </li>
          </ul>
        </div>
      </main>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        currentPlan={userPlan}
        reason="manual"
        todayCount={stats.todayCount}
        monthlyCount={stats.monthCount}
      />

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center text-sm text-gray-400">
          Built with MintKit · <a href="/pricing" className="hover:text-emerald-600">Pricing</a> · <a href="/faq" className="hover:text-emerald-600">FAQ</a>
        </div>
      </footer>
    </div>
  );
}
