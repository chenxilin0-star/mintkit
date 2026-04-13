import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Refund Policy - MintKit',
  description: 'Refund Policy for MintKit - Information about our 7-day money-back guarantee.',
};

export default function RefundPage() {
  const pageUrl = 'https://mintkit.vercel.app/refund';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: April 13, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7-Day Money-Back Guarantee</h2>
            <p className="text-gray-600 leading-relaxed">
              We offer a 7-day money-back guarantee for all paid plans. If you're not satisfied with MintKit within the first 7 days of your subscription, contact us and we'll process a full refund—no questions asked.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">How to Request a Refund</h2>
            <p className="text-gray-600 leading-relaxed">
              To request a refund, please contact our support team at{' '}
              <a href="mailto:chenxilin0@gmail.com" className="text-emerald-600 hover:underline">
                chenxilin0@gmail.com
              </a>{' '}
              with your account email and the reason for your refund request. We'll respond within 1-2 business days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Refund Timeline</h2>
            <p className="text-gray-600 leading-relaxed">
              Once your refund is approved, the amount will be credited to your original payment method within 5-10 business days. The exact timing depends on your payment provider and financial institution.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Eligibility</h2>
            <p className="text-gray-600 leading-relaxed">
              Refund requests are eligible if made within 7 days of your initial subscription purchase. After 7 days, refund requests will be considered on a case-by-case basis. Multiple refund requests from the same account may not be honored.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Subscription Cancellation</h2>
            <p className="text-gray-600 leading-relaxed">
              If you receive a refund, your subscription will be cancelled and you will lose access to premium features immediately upon refund processing. You will revert to the Free plan.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Partial Refunds</h2>
            <p className="text-gray-600 leading-relaxed">
              We do not offer partial refunds for unused portions of a billing period. The full refund applies only to the initial 7-day window. If you upgrade mid-cycle and request a refund, you will be refunded the amount of the upgrade.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about our refund policy or need assistance, please reach out to us at{' '}
              <a href="mailto:chenxilin0@gmail.com" className="text-emerald-600 hover:underline">
                chenxilin0@gmail.com
              </a>
              . We're here to help!
            </p>
          </section>
        </div>

        {/* Page URL for Paddle verification */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Page URL: <span className="font-mono">{pageUrl}</span>
          </p>
        </div>

        {/* Legal links */}
        <div className="flex gap-4 text-sm text-gray-400 justify-center mt-8">
          <Link href="/terms-and-conditions" className="hover:text-gray-600 transition-colors">Terms & Conditions</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/refund" className="hover:text-gray-600 transition-colors">Refund Policy</Link>
        </div>
      </main>
    </div>
  );
}
