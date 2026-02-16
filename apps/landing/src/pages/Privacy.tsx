import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Shield className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h1 className="text-6xl md:text-7xl font-light mb-4">
              Your data is
              <br />
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
                  yours.
                </span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-yellow-200 -z-0 opacity-30" />
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              We don't sell your data. We don't share it without permission.
              We just process payments and get out of your way.
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

      {/* Privacy sections */}
      <section className="py-12 px-4">
        <div className="container max-w-3xl mx-auto space-y-12">
          {[
            {
              icon: Eye,
              title: 'What we collect',
              content: 'We collect only what\'s necessary to process payments and provide support: your name, email, business information, and transaction history. We never store full credit card numbers — that\'s handled by our payment partners.'
            },
            {
              icon: Lock,
              title: 'How we use it',
              content: 'Your information is used to process payments, provide customer support, and improve our services. We don\'t sell your data to advertisers or third parties. Period.'
            },
            {
              icon: Database,
              title: 'Data retention',
              content: 'We keep your transaction history as long as you have an active account. If you close your account, we\'ll delete your data within 30 days unless required by law to retain it.'
            },
            {
              icon: Mail,
              title: 'Communication',
              content: 'We\'ll only email you about your account, important updates, or if you opt into our newsletter. You can unsubscribe from marketing emails anytime.'
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
                className="bg-gray-50 rounded-2xl p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-light mb-3">{section.title}</h2>
                    <p className="text-gray-400 leading-relaxed">{section.content}</p>
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
            className="bg-black text-white rounded-3xl p-12"
          >
            <h2 className="text-3xl md:text-4xl font-light mb-4">Questions about privacy?</h2>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              We're happy to answer any questions about how we handle your data.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full hover:bg-gray-100 transition-colors"
            >
              Contact us
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}