import type { Metadata } from 'next';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'FAQ - MintKit',
  description: 'Frequently asked questions about MintKit pricing, payments, and subscriptions.',
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Everything you need to know about MintKit pricing, billing, and subscriptions.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-6 mb-16">
          {/* Billing & Payments */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              💳 Billing & Payments
            </h2>
            <div className="space-y-3">
              <FAQItem
                q="What payment methods do you accept?"
                a="We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover) through PayPal. You don't need a PayPal account — you can pay directly with your card on the PayPal checkout page."
              />
              <FAQItem
                q="Is my payment secure?"
                a="Yes! All payments are processed securely through PayPal, one of the world's leading payment processors. We never store your card details on our servers."
              />
              <FAQItem
                q="Can I get a refund?"
                a="We offer a 7-day money-back guarantee for all paid plans. If you're not satisfied within the first 7 days, contact us at chenxilin0@gmail.com and we'll process a full refund through PayPal."
              />
              <FAQItem
                q="Will I be charged automatically?"
                a="Yes, PayPal subscriptions renew automatically each month. You can cancel anytime from your PayPal account or our subscription management page."
              />
            </div>
          </section>

          {/* Subscriptions */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              🔄 Subscriptions & Plans
            </h2>
            <div className="space-y-3">
              <FAQItem
                q="How do I cancel my subscription?"
                a="You can cancel anytime from your PayPal account (Settings → Payments → Manage pre-approved payments), or contact us at chenxilin0@gmail.com. Your access continues until the end of the current billing period — we don't prorate cancellations."
              />
              <FAQItem
                q="Can I switch between Basic and Premium?"
                a="Yes! You can upgrade or downgrade your plan anytime. When upgrading, PayPal will charge the prorated difference immediately. When downgrading, the change takes effect at the end of your current billing period."
              />
              <FAQItem
                q="Do you offer yearly billing?"
                a="Yearly billing is on our roadmap and coming soon! Yearly plans will offer approximately 2 months free compared to monthly billing. Subscribe to our newsletter to be notified when yearly plans launch."
              />
              <FAQItem
                q="What counts as a 'generation'?"
                a="Each time you select a product idea and generate a full PDF product (planner, checklist, or guide), it counts as one generation. Browsing ideas and changing templates don't count against your limit."
              />
            </div>
          </section>

          {/* Free Plan */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              🆓 Free Plan
            </h2>
            <div className="space-y-3">
              <FAQItem
                q="What can I do on the Free plan?"
                a="The Free plan lets you generate 1 product idea per day. You can preview the generated content but cannot download the PDF or copy the content. It's perfect for trying out MintKit before committing to a paid plan."
              />
              <FAQItem
                q="Does the Free plan reset?"
                a="Yes! Your daily generation limit resets at midnight (UTC) each day. If you generate 1 product today, you'll have 1 more generation available tomorrow."
              />
            </div>
          </section>

          {/* Privacy & Data */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              🔒 Privacy & Data
            </h2>
            <div className="space-y-3">
              <FAQItem
                q="Is my data safe?"
                a="Absolutely. Your data is stored securely on Cloudflare's infrastructure. We use industry-standard encryption. You retain full ownership of all generated products — we never claim any rights to your creations."
              />
              <FAQItem
                q="Do you share my data with third parties?"
                a="No. We only share the minimum data required with PayPal to process your subscription. We never sell, rent, or share your personal data with advertisers or other third parties."
              />
              <FAQItem
                q="Can I delete my account?"
                a="Yes. Contact us at chenxilin0@gmail.com and we'll permanently delete your account and all associated data within 30 days, in accordance with GDPR and CCPA regulations."
              />
            </div>
          </section>

          {/* Products & Usage */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              📄 Products & Usage
            </h2>
            <div className="space-y-3">
              <FAQItem
                q="What can I do with generated products?"
                a="Everything! You own full commercial rights to all products you generate with MintKit. Sell them on Gumroad, Etsy, your own website, or anywhere else — royalty-free."
              />
              <FAQItem
                q="What's the difference between the product types?"
                a="Planners typically include multiple pages with sections, calendars, and tracking elements. Checklists focus on actionable steps with checkboxes. Guides provide comprehensive information with a mix of content types. All three are full-length, sellable digital products."
              />
              <FAQItem
                q="Can I regenerate a product with the same idea?"
                a="Yes! Each generation is independent. You can regenerate the same product idea with different templates or settings. Each regeneration counts as one generation against your plan limit."
              />
            </div>
          </section>
        </div>

        {/* Still have questions */}
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border border-gray-200 p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-500 mb-5">We typically respond within 24 hours.</p>
          <a
            href="mailto:chenxilin0@gmail.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            📧 Email Us
          </a>
        </div>
      </main>
{/* Footer */}
      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center space-y-3">
          <div className="text-sm text-gray-400">
            Built with MintKit · © {new Date().getFullYear()} MintKit
          </div>
          <div className="flex gap-4 text-sm text-gray-400 justify-center">
            <a href="/terms-and-conditions" className="hover:text-gray-600 transition-colors">Terms & Conditions</a>
            <span>·</span>
            <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
            <span>·</span>
            <a href="/refund" className="hover:text-gray-600 transition-colors">Refund Policy</a>
            <span>·</span>
            <a href="mailto:chenxilin0@gmail.com" className="hover:text-gray-600 transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="bg-white rounded-xl border border-gray-100 p-5 group">
      <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
        <span>{q}</span>
        <span className="text-gray-400 group-open:rotate-45 transition-transform ml-4 shrink-0 text-lg">✕</span>
      </summary>
      <p className="mt-3 text-sm text-gray-600 leading-relaxed">{a}</p>
    </details>
  );
}
