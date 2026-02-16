import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Scale, 
  Clock, 
  HelpCircle,
  Shield,
  DollarSign,
  Users,
  Ban,
  Gavel,
  FileCheck,
  Zap,
  Globe,
  ArrowRight,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function Terms() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Scale className="w-20 h-20 text-gray-200 mx-auto mb-6" />
            <h1 className="text-6xl md:text-7xl font-light mb-4">
              Fair terms for{' '}
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
                  fair business.
                </span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-yellow-200 -z-0 opacity-30" />
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              No legalese. No hidden surprises. Just clear terms that respect you and your business.
              These terms were last updated February 16, 2026 and are effective immediately.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Summary Card */}
      <section className="py-6 px-4">
        <div className="container max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-yellow-50 border border-yellow-100 rounded-2xl p-6"
          >
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              Key Takeaways
            </h3>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">2.5% fee</p>
                <p className="text-gray-500">Clear pricing</p>
              </div>
              <div>
                <p className="font-medium">30-day notice</p>
                <p className="text-gray-500">For fee changes</p>
              </div>
              <div>
                <p className="font-medium">Cancel anytime</p>
                <p className="text-gray-500">No penalties</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Terms sections */}
      <section className="py-12 px-4">
        <div className="container max-w-3xl mx-auto space-y-8">
          {[
            {
              icon: FileText,
              title: '1. Agreement to Terms',
              content: 'By accessing or using Drift, you agree to be bound by these Terms of Service and our Privacy Policy. If you are using Drift on behalf of a business, you represent that you have the authority to bind that business.',
              legal: 'Effective Date: February 16, 2026'
            },
            {
              icon: Shield,
              title: '2. Eligibility',
              content: 'You must be at least 18 years old and capable of forming a binding contract. We may require additional verification for businesses in regulated industries.',
              legal: 'Age requirement: 18+'
            },
            {
              icon: CheckCircle,
              title: '3. Account Registration',
              content: 'You are responsible for maintaining account security and providing accurate information. Notify us immediately of any unauthorized access. You are liable for all activity under your account.',
              legal: 'Zero-liability policy for unauthorized transactions'
            },
            {
              icon: DollarSign,
              title: '4. Fees and Payments',
              content: `Our fees are clearly displayed and deducted automatically:
                • Standard rate: 2.5% per transaction
                • Volume discounts: Available at $50k+/month
                • Instant payouts: 1% fee (where available)
                • No setup fees, monthly minimums, or hidden charges
                • Fee changes with 30 days notice`,
              legal: 'Fees subject to change with notice'
            },
            {
              icon: Clock,
              title: '5. Payout Schedule',
              content: `Funds are settled according to your payout schedule:
                • Standard: 2-3 business days (free)
                • Instant: 30 minutes (1% fee, eligibility required)
                • First payout: May take up to 7 days for verification
                • Daily limits apply to instant payouts`,
              legal: 'Settlement times may vary by bank'
            },
            {
              icon: AlertCircle,
              title: '6. Chargebacks and Disputes',
              content: `You are responsible for chargebacks and disputes:
                • We provide tools to help prevent disputes
                • Chargeback fees may apply
                • We may withhold funds for active disputes
                • Excessive chargebacks may result in account suspension`,
              legal: 'Visa/Mastercard rules apply'
            },
            {
              icon: Users,
              title: '7. User Responsibilities',
              content: `You agree to:
                • Provide accurate business information
                • Use Drift for lawful purposes only
                • Not engage in fraudulent activity
                • Maintain appropriate security measures
                • Comply with all applicable laws`,
              legal: 'Indemnification clause applies'
            },
            {
              icon: Ban,
              title: '8. Prohibited Activities',
              content: `Drift may not be used for:
                • Illegal goods or services
                • High-risk activities without approval
                • Intellectual property infringement
                • Phishing or deceptive practices
                • Reselling our services without permission`,
              legal: 'Full list available upon request'
            },
            {
              icon: Gavel,
              title: '9. Intellectual Property',
              content: 'We retain all rights to our platform and branding. You retain rights to your business data. You grant us a license to use your business name for marketing purposes.',
              legal: 'Opt-out available'
            },
            {
              icon: FileCheck,
              title: '10. Data Processing',
              content: 'We process data as described in our Privacy Policy. For EU users, we act as a data controller for account data and processor for transaction data.',
              legal: 'GDPR Art. 28 compliant'
            },
            {
              icon: Shield,
              title: '11. Limitation of Liability',
              content: 'To the maximum extent permitted by law, Drift shall not be liable for indirect, incidental, or consequential damages. Our total liability is limited to the fees paid in the 12 months preceding the claim.',
              legal: 'Some jurisdictions may differ'
            },
            {
              icon: Scale,
              title: '12. Indemnification',
              content: 'You agree to indemnify and hold Drift harmless from claims arising from your use of the service, violation of these terms, or infringement of third-party rights.',
              legal: 'Standard indemnification clause'
            },
            {
              icon: HelpCircle,
              title: '13. Termination',
              content: `You may close your account anytime. We may suspend or terminate accounts for:
                • Terms violations
                • Illegal activity
                • Excessive chargebacks
                • Non-payment
              You can export your data before closure.`,
              legal: 'Data retained as required by law'
            },
            {
              icon: Globe,
              title: '14. Governing Law',
              content: 'These terms are governed by the laws of the State of Wisconsin, without regard to its conflict of laws principles.',
              legal: 'Great Lakes pride! 🌊'
            },
            {
              icon: Building2,
              title: '15. Contact Information',
              content: 'For questions about these terms, please contact us at:',
              legal: (
                <div className="space-y-1">
                  <p><a href="mailto:legal@driftpos.com" className="text-black hover:underline">legal@driftpos.com</a></p>
                  <p className="text-gray-400 text-xs">Drift Technologies Inc. (Coming soon to the Great Lakes)</p>
                </div>
              )
            },
            {
              icon: Clock,
              title: '16. Changes to Terms',
              content: 'We may update these terms with 30 days notice. Continued use constitutes acceptance. Material changes will be communicated via email.',
              legal: 'Last updated: Feb 16, 2026'
            }
          ].map((section, i) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border-b border-gray-100 pb-8 last:border-0 hover:bg-gray-50/30 p-4 rounded-xl transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-light mb-2">{section.title}</h2>
                    <p className="text-gray-500 mb-2">{section.content}</p>
                    <div className="text-xs text-gray-400 font-mono">{section.legal}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Contact section */}
      <section className="py-20 px-4">
        <div className="container max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-12"
          >
            <h2 className="text-3xl md:text-4xl font-light mb-4">Questions about the terms?</h2>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              Our legal team is happy to explain any part of these terms in plain English.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/faq"
                className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full hover:bg-gray-100 transition-colors"
              >
                Visit FAQ
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="mailto:legal@driftpos.com"
                className="inline-flex items-center gap-2 border border-white/20 text-white px-6 py-3 rounded-full hover:bg-white/10"
              >
                legal@driftpos.com
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}