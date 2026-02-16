import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  CheckCircle, 
  Server, 
  Key, 
  AlertTriangle,
  FileCheck,
  CreditCard,
  Fingerprint,
  Globe,
  Clock,
  Users,
  HardDrive,
  ShieldCheck,
  Eye,
  Bell,
  Mail
} from 'lucide-react';

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
            <div className="relative inline-block">
              <Lock className="w-20 h-20 text-gray-200 mx-auto mb-6" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white"
              />
            </div>
            
            <h1 className="text-6xl md:text-7xl font-light mb-4">
              Security is our{' '}
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
                  first priority.
                </span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-yellow-200 -z-0 opacity-30" />
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              We meet the highest standards for payment security. Bank-level encryption, 
              continuous monitoring, and independent audits.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="container max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, label: 'PCI DSS Level 1', verified: true },
              { icon: FileCheck, label: 'SOC 2 Type II', verified: true },
              { icon: Globe, label: 'GDPR Compliant', verified: true },
              { icon: Key, label: '256-bit SSL', verified: true }
            ].map((cert, i) => {
              const Icon = cert.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl p-6 text-center hover:shadow-md transition-all group"
                >
                  <Icon className="w-8 h-8 mx-auto mb-3 text-gray-700 group-hover:text-black transition-colors" />
                  <div className="text-sm font-medium mb-1">{cert.label}</div>
                  {cert.verified && (
                    <span className="text-xs text-green-600">✓ Verified</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security metrics */}
      <section className="py-12 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { value: '100%', label: 'Uptime SLA', icon: Clock },
              { value: '24/7', label: 'Threat Monitoring', icon: Eye },
              { value: '0', label: 'Data Breaches', icon: ShieldCheck },
              { value: '99.99%', label: 'Fraud Prevention', icon: Bell }
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <div className="text-2xl font-light text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security sections */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-light text-center mb-12"
          >
            Defense in depth
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Lock,
                title: 'Encryption',
                description: 'All data encrypted in transit and at rest',
                details: [
                  'TLS 1.3 for all connections',
                  'AES-256 for stored data',
                  'Hardware Security Modules (HSM) for keys',
                  'Perfect Forward Secrecy'
                ]
              },
              {
                icon: Server,
                title: 'Infrastructure',
                description: 'Isolated, monitored, and hardened',
                details: [
                  '24/7 security monitoring',
                  'Automated threat detection',
                  'Regular penetration testing',
                  'DDoS protection'
                ]
              },
              {
                icon: Key,
                title: 'Access Control',
                description: 'Zero-trust architecture',
                details: [
                  'Multi-factor authentication required',
                  'Least privilege access',
                  'Detailed audit logs',
                  'Session management'
                ]
              },
              {
                icon: AlertTriangle,
                title: 'Incident Response',
                description: 'Rapid response to security events',
                details: [
                  '24/7 on-call security team',
                  'Automated alerts',
                  'Customer notification within 24h',
                  'Post-incident reviews'
                ]
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
                  className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">{section.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{section.description}</p>
                  <ul className="space-y-2">
                    {section.details.map((detail, j) => (
                      <li key={j} className="text-sm text-gray-500 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
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
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-black text-white rounded-3xl p-12 text-center"
          >
            <CreditCard className="w-16 h-16 mx-auto mb-6 text-white/60" />
            <h2 className="text-4xl font-light mb-4">PCI DSS Level 1 Compliant</h2>
            <p className="text-white/60 mb-8 max-w-2xl mx-auto">
              We meet the highest standards for payment security. Our systems are audited annually 
              by independent third-party security firms. We maintain compliance with PCI DSS v3.2.1.
            </p>
            <div className="flex justify-center gap-6 text-sm text-white/80">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Annual audits
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Vulnerability scans
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Penetration testing
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Security contact */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="container max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8"
            >
              <h3 className="text-xl font-light mb-4">SOC 2 Type II Report</h3>
              <p className="text-gray-400 text-sm mb-4">
                Our SOC 2 Type II audit validates our controls for security, availability, 
                and confidentiality. Available under NDA.
              </p>
              <a
                href="mailto:security@driftpos.com"
                className="text-sm text-black hover:underline"
              >
                Request access →
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8"
            >
              <h3 className="text-xl font-light mb-4">Bug Bounty Program</h3>
              <p className="text-gray-400 text-sm mb-4">
                We welcome responsible disclosure of security vulnerabilities. 
                Rewards range from $100 to $5,000 based on severity.
              </p>
              <a
                href="mailto:security@driftpos.com"
                className="text-sm text-black hover:underline"
              >
                security@driftpos.com →
              </a>
            </motion.div>
          </div>
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
              We take security seriously. If you've found a security issue, please report it responsibly 
              and we'll respond within 24 hours.
            </p>
            <a
              href="mailto:security@driftpos.com"
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors"
            >
              security@driftpos.com
            </a>
            <p className="text-xs text-gray-300 mt-4">
              PGP fingerprint available upon request
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}