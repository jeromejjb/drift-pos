import { motion } from 'framer-motion';
import { FileText, CheckCircle, AlertCircle, Scale, Clock, HelpCircle } from 'lucide-react';
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
            <Scale className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h1 className="text-6xl md:text-7xl font-light mb-4">
              Fair terms for
              <br />
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
                  fair business.
                </span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-yellow-200 -z-0 opacity-30" />
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              No legalese. No hidden surprises. Just clear terms that respect you and your business.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Last updated */}
      <div className="container max-w-3xl mx-auto px-4">
        <p className="text-sm text-gray-300 text-center mb-12">
          Last updated: February 16, 2026
        </p>
      </div>

      {/* Terms sections */}
      <section className="py-12 px-4">
        <div className="container max-w-3xl mx-auto space-y-8">
          {[
            {
              icon: FileText,
              title: '1. Agreement',
              content: 'By using Drift, you agree to these terms. If you\'re accepting on behalf of a business, you represent that you have the authority to bind that business.'
            },
            {
              icon: CheckCircle,
              title: '2. Your account',
              content: 'You\'re responsible for maintaining your account security. Notify us immediately if you suspect unauthorized access. You\'re responsible for all activity under your account.'
            },
            {
              icon: AlertCircle,
              title: '3. Payment terms',
              content: 'Our fees are clearly displayed and deducted automatically. We reserve the right to change fees with 30 days notice. Continued use constitutes acceptance of new fees.'
            },
            {
              icon: Clock,
              title: '4. Payout schedule',
              content: 'Standard payouts are processed next business day. Instant payouts (where available) incur a 1% fee. We may adjust payout schedules based on risk assessment.'
            },
            {
              icon: Scale,
              title: '5. Liability',
              content: 'We process payments but aren\'t liable for disputes between you and your customers. We provide tools to help, but you\'re responsible for your goods and services.'
            },
            {
              icon: HelpCircle,
              title: '6. Termination',
              content: 'You can close your account anytime. We may suspend or terminate accounts for violations of these terms. You can export your data before closure.'
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
                className="border-b border-gray-100 pb-8 last:border-0"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-light mb-2">{section.title}</h2>
                    <p className="text-gray-400">{section.content}</p>
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
            className="bg-gray-50 rounded-3xl p-12"
          >
            <h2 className="text-3xl font-light mb-4">Questions about the terms?</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              We know legal documents can be confusing. We're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/faq"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors"
              >
                Visit FAQ
                <FileText className="w-4 h-4" />
              </Link>
              <a
                href="mailto:legal@drift.com"
                className="inline-flex items-center gap-2 border border-gray-200 px-6 py-3 rounded-full hover:border-black transition-colors"
              >
                legal@drift.com
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}