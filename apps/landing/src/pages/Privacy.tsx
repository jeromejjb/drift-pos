import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Eye, 
  Database, 
  Mail, 
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Trash2,
  RefreshCw,
  Fingerprint,
  Globe,
  FileJson
} from 'lucide-react';
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
            <div className="relative inline-block">
              <Shield className="w-20 h-20 text-gray-200 mx-auto mb-6" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white"
              />
            </div>
            
            <h1 className="text-6xl md:text-7xl font-light mb-4">
              Your data is{' '}
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

      {/* Key Principles */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="container max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: 'Data Ownership', desc: 'You own your data. Always.' },
              { icon: UserCheck, title: 'Never Sold', desc: 'We don\'t sell to advertisers. Period.' },
              { icon: Fingerprint, title: 'Minimal Collection', desc: 'Only what\'s needed for payments.' }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-6 text-center shadow-sm"
                >
                  <Icon className="w-8 h-8 mx-auto mb-3 text-black" />
                  <h3 className="font-medium mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Last updated with legal timestamp */}
      <div className="container max-w-3xl mx-auto px-4">
        <p className="text-sm text-gray-300 text-center mb-8">
          Last updated: February 16, 2026 · Effective immediately
        </p>
      </div>

      {/* Privacy sections with legal precision */}
      <section className="py-12 px-4">
        <div className="container max-w-3xl mx-auto space-y-8">
          {[
            {
              icon: Eye,
              title: '1. Information We Collect',
              content: `We collect only what's necessary to provide our payment services:
                • Account information: name, email, phone number
                • Business information: business name, address, tax ID
                • Transaction data: payment amounts, dates, merchant information
                • Device and usage data: IP address, browser type, pages visited`,
              legal: 'Legitimate interest under GDPR Art. 6(1)(f)'
            },
            {
              icon: Database,
              title: '2. How We Use Your Information',
              content: `Your information is used exclusively for:
                • Processing payments and preventing fraud
                • Providing customer support
                • Improving our services
                • Legal compliance and dispute resolution`,
              legal: 'Contract performance under GDPR Art. 6(1)(b)'
            },
            {
              icon: Lock,
              title: '3. Data Security',
              content: `We implement bank-grade security measures:
                • 256-bit AES encryption for data at rest
                • TLS 1.3 for data in transit
                • PCI DSS Level 1 certified
                • Annual third-party security audits
                • Never store full credit card numbers`,
              legal: 'PCI DSS compliance verified'
            },
            {
              icon: RefreshCw,
              title: '4. Data Sharing',
              content: `We only share data with:
                • Stripe, Inc. for payment processing (their privacy policy applies)
                • Legal authorities when required by law
                • Service providers bound by confidentiality agreements
              We never sell your personal information to third parties.`,
              legal: 'Data Processing Agreements in place'
            },
            {
              icon: Trash2,
              title: '5. Data Retention',
              content: `• Active accounts: retained as long as account is active
                • Closed accounts: deleted within 30 days
                • Transaction records: retained for 7 years (tax compliance)
                • You can request data export anytime`,
              legal: 'CCPA & GDPR compliant'
            },
            {
              icon: Mail,
              title: '6. Your Rights',
              content: `Under GDPR and CCPA, you have the right to:
                • Access your personal data
                • Correct inaccurate data
                • Delete your data (right to be forgotten)
                • Export your data (data portability)
                • Opt out of marketing communications`,
              legal: 'Exercisable by emailing privacy@driftpos.com'
            },
            {
              icon: Globe,
              title: '7. International Data Transfers',
              content: `We primarily store data in the United States. For international users, we ensure:
                • Standard Contractual Clauses (SCCs) are in place
                • Adequate data protection measures
                • Compliance with local regulations`,
              legal: 'GDPR Chapter V compliant'
            },
            {
              icon: FileJson,
              title: '8. Cookies and Tracking',
              content: `We use essential cookies for:
                • Authentication and security
                • Payment processing
                • Basic functionality
              No tracking cookies for advertising.`,
              legal: 'ePrivacy Directive compliant'
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
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-light mb-3">{section.title}</h2>
                    <div className="text-gray-500 leading-relaxed whitespace-pre-line mb-3">
                      {section.content}
                    </div>
                    <p className="text-xs text-gray-400 font-mono bg-white/50 p-2 rounded-lg inline-block">
                      {section.legal}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Data Processing Agreement */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="container max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8"
          >
            <h2 className="text-2xl font-light mb-4">Data Processing Agreement</h2>
            <p className="text-gray-400 mb-4">
              As a payments processor, we act as a data controller for your account information 
              and a data processor for transaction data. Our Data Processing Agreement (DPA) 
              reflects our commitment to GDPR compliance.
            </p>
            <div className="flex gap-4">
              <a
                href="/dpa.pdf"
                className="inline-flex items-center gap-2 text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                Download DPA
              </a>
              <a
                href="/sccs.pdf"
                className="inline-flex items-center gap-2 text-sm border border-gray-200 px-4 py-2 rounded-lg hover:border-black"
              >
                Standard Contractual Clauses
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact section */}
      <section className="py-20 px-4">
        <div className="container max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-black to-gray-800 text-white rounded-3xl p-12"
          >
            <h2 className="text-3xl md:text-4xl font-light mb-4">Questions about your data?</h2>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              Our Data Protection Officer responds to all privacy inquiries within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full hover:bg-gray-100 transition-colors"
              >
                Contact DPO
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="mailto:privacy@driftpos.com"
                className="inline-flex items-center gap-2 border border-white/20 text-white px-6 py-3 rounded-full hover:bg-white/10"
              >
                privacy@driftpos.com
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}