import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  CheckCircle, 
  Server, 
  Key, 
  AlertTriangle,
  FileCheck,
  CreditCard
} from 'lucide-react';
// Removed unused Link import

export function Security() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Lock className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h1 className="text-6xl md:text-7xl font-light mb-4">
              Security is our
              <br />
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
                  first priority.
                </span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-yellow-200 -z-0 opacity-30" />
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              We use bank-level encryption and follow strict security protocols to keep your data safe.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: CheckCircle, label: 'PCI DSS Level 1' },
              { icon: Shield, label: 'SOC 2 Type II' },
              { icon: FileCheck, label: 'GDPR Compliant' },
              { icon: Key, label: '256-bit SSL' }
            ].map((cert, i) => {
              const Icon = cert.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gray-50 rounded-xl p-6 text-center"
                >
                  <Icon className="w-8 h-8 mx-auto mb-3 text-gray-700" />
                  <div className="text-sm font-medium">{cert.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security sections */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Lock,
                title: 'Encryption',
                description: 'All data is encrypted in transit and at rest using 256-bit AES encryption. We never store full credit card numbers.',
                details: ['TLS 1.3 for all connections', 'AES-256 for stored data', 'Tokenization for payment data']
              },
              {
                icon: Server,
                title: 'Infrastructure',
                description: 'Our infrastructure runs on secure, isolated servers with continuous monitoring and intrusion detection.',
                details: ['24/7 security monitoring', 'Automated threat detection', 'Regular penetration testing']
              },
              {
                icon: Key,
                title: 'Access control',
                description: 'Strict access controls ensure only authorized personnel can access sensitive systems.',
                details: ['Multi-factor authentication', 'Least privilege access', 'Detailed audit logs']
              },
              {
                icon: AlertTriangle,
                title: 'Incident response',
                description: 'We have a dedicated security team and incident response plan to address any issues immediately.',
                details: ['24/7 on-call team', 'Automated alerts', 'Customer notification within 24h']
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
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-medium mb-3">{section.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{section.description}</p>
                  <ul className="space-y-2">
                    {section.details.map((detail, j) => (
                      <li key={j} className="text-sm text-gray-500 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-3xl font-light mb-4">PCI DSS Level 1 Compliant</h2>
            <p className="text-gray-400 mb-6 max-w-xl mx-auto">
              We meet the highest standards for payment security. Our systems are audited annually by third-party security firms.
            </p>
            <div className="flex justify-center gap-4 text-sm text-gray-300">
              <span>✓ Annual audits</span>
              <span>✓ Vulnerability scans</span>
              <span>✓ Penetration testing</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Report vulnerability */}
      <section className="py-20 px-4">
        <div className="container max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-light mb-4">Found a vulnerability?</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              We take security seriously. If you've found a security issue, please report it responsibly.
            </p>
            <a
              href="mailto:security@driftpos.com"
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors"
            >
              security@driftpos.com
            </a>
            <p className="text-xs text-gray-300 mt-4">
              We offer bounties for verified security issues.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}