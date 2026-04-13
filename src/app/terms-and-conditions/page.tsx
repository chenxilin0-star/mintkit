import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Terms & Conditions - MintKit',
  description: 'Terms and Conditions for using MintKit AI-powered digital product generation services.',
};

export default function TermsAndConditionsPage() {
  const pageUrl = 'https://mintkit.vercel.app/terms-and-conditions';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms & Conditions</h1>
          <p className="text-gray-500 text-sm">Last updated: April 13, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By using MintKit, you agree to these Terms and Conditions. If you do not agree with any part of these terms, please do not use our services. Your continued use of MintKit constitutes acceptance of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Service Description</h2>
            <p className="text-gray-600 leading-relaxed">
              MintKit provides AI-powered digital product generation services. We help users create digital products such as planners, checklists, and guides by entering a niche topic. The generated content is intended for personal and commercial use.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Subscription and Billing</h2>
            <div className="text-gray-600 leading-relaxed space-y-2">
              <p>MintKit offers the following subscription plans:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Free Plan:</strong> 1 generation per day, basic features</li>
                <li><strong>Basic Plan:</strong> $9.99/month, 30 generations per month, PDF downloads, content copy</li>
                <li><strong>Premium Plan:</strong> $29.99/month, unlimited generations, priority processing, PDF downloads, content copy</li>
              </ul>
              <p className="mt-3">All prices are listed in USD and are subject to change with prior notice.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Payment Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              Payments are processed securely via Paddle. By subscribing to a paid plan, you authorize us to charge your payment method on a recurring monthly basis. All payments are non-refundable except as outlined in our Refund Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Cancellation Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              You may cancel your subscription at any time by contacting our support team. Your subscription will remain active until the end of the current billing period. After cancellation, you will revert to the Free plan and will lose access to premium features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
            <p className="text-gray-600 leading-relaxed">
              You retain full ownership of all digital products you generate using MintKit. You are free to use, sell, and distribute the generated content for personal or commercial purposes. MintKit claims no ownership over the content you create.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Acceptable Use</h2>
            <p className="text-gray-600 leading-relaxed">
              You agree not to use MintKit for any illegal or unauthorized purpose. You must not violate any laws in your jurisdiction, including but not limited to copyright laws. You are responsible for ensuring your generated content complies with all applicable laws and regulations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              MintKit is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted or error-free. We shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the service. Continued use of MintKit after such modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about these Terms & Conditions, please contact us at{' '}
              <a href="mailto:support@mintkit.cxlvip.com" className="text-emerald-600 hover:underline">
                support@mintkit.cxlvip.com
              </a>
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
