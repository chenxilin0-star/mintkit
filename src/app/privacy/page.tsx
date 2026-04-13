import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Privacy Policy - MintKit',
  description: 'Privacy Policy for MintKit - How we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  const pageUrl = 'https://mintkit.vercel.app/privacy';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: April 13, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <div className="text-gray-600 leading-relaxed space-y-2">
              <p>We collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Account Information:</strong> When you sign up, we collect your name and email address through authentication services.</li>
                <li><strong>Usage Data:</strong> We track your usage of the service, including the number of generations, features accessed, and timestamps.</li>
                <li><strong>Payment Information:</strong> Payment processing is handled by Paddle. We do not store your credit card or payment details on our servers.</li>
                <li><strong>Niche Input:</strong> The topics and niches you enter to generate digital products.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <div className="text-gray-600 leading-relaxed space-y-2">
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide and maintain our AI-powered digital product generation services</li>
                <li>Process your subscription and manage billing</li>
                <li>Improve and optimize the user experience</li>
                <li>Send service-related notifications and updates</li>
                <li>Respond to your support requests and inquiries</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Data Storage</h2>
            <p className="text-gray-600 leading-relaxed">
              Your data is stored securely using Cloudflare D1, a distributed database service. We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Third-Party Services</h2>
            <div className="text-gray-600 leading-relaxed space-y-2">
              <p>We use the following third-party services:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Paddle:</strong> For payment processing and subscription management. Their privacy policy governs how they handle your payment data.</li>
                <li><strong>Cloudflare:</strong> For data storage and security. Their privacy policy applies to how they process your data.</li>
                <li><strong>Authentication Services:</strong> For secure account creation and login.</li>
              </ul>
              <p className="mt-3">We do not sell, trade, or rent your personal information to third parties.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              We use cookies and similar tracking technologies to maintain your session, remember your preferences, and analyze how you use our service. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your account information for as long as your account is active. If you delete your account, we will delete your data within a reasonable timeframe, except where we are required by law to retain certain information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed">
              You have the right to access, update, or delete your personal information at any time. You may also request a copy of your data or ask us to stop processing your information. To exercise these rights, please contact us at{' '}
              <a href="mailto:chenxilin0@gmail.com" className="text-emerald-600 hover:underline">
                chenxilin0@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Children's Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              MintKit is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a minor, we will take steps to delete that information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of MintKit after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:chenxilin0@gmail.com" className="text-emerald-600 hover:underline">
                chenxilin0@gmail.com
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
