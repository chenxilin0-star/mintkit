'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import UpgradeModal from './UpgradeModal';
import { Plan, getPlanColor, getPlanLabel } from '@/lib/subscription';

interface HeaderProps {
  showBack?: boolean;
  backLabel?: string;
  onBack?: () => void;
}

export default function Header({ showBack, backLabel, onBack }: HeaderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [userPlan, setUserPlan] = useState<Plan>('free');
  const [todayCount, setTodayCount] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);

  // Fetch user plan info
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/plan')
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) {
            setUserPlan(data.plan || 'free');
            setTodayCount(data.todayCount || 0);
            setMonthlyCount(data.monthlyCount || 0);
          }
        })
        .catch(() => {});
    }
  }, [status]);

  return (
    <>
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white text-lg font-bold">M</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">MintKit</h1>
              <p className="text-xs text-gray-500">AI Digital Product Generator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Back button */}
            {showBack && (
              <button
                onClick={onBack}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 min-h-[36px] px-3"
              >
                ← {backLabel || 'Back'}
              </button>
            )}

            {/* Nav links */}
            <button
              onClick={() => router.push('/pricing')}
              className="text-sm text-gray-500 hover:text-emerald-600 transition-colors min-h-[36px] px-3 flex items-center"
            >
              Pricing
            </button>

            {/* Auth Section */}
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-2">
                {/* Plan badge */}
                <button
                  onClick={() => setShowUpgrade(true)}
                  className={`hidden sm:flex text-xs font-medium px-2.5 py-1 rounded-full border transition-colors hover:opacity-80 ${getPlanColor(userPlan)}`}
                  title="Click to manage subscription"
                >
                  {getPlanLabel(userPlan)}
                </button>

                <div className="hidden sm:block text-right">
                  <p className="text-xs font-medium text-gray-700 max-w-[100px] truncate">
                    {session.user?.name}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {session.user?.email}
                  </p>
                </div>

                <img
                  src={session.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.name || 'U')}&background=10B981&color=fff`}
                  alt={session.user?.name || 'User'}
                  className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer"
                  onClick={() => router.push('/dashboard')}
                  title="Dashboard"
                />

                <button
                  onClick={() => signOut()}
                  className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                  title="Sign out"
                >
                  ⎋
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="text-sm px-4 py-2 min-h-[36px] bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        currentPlan={userPlan}
        reason="manual"
        todayCount={todayCount}
        monthlyCount={monthlyCount}
      />
    </>
  );
}
