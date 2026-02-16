import { motion } from 'framer-motion';
import { 
  Zap, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Globe, 
  Shield,
} from 'lucide-react';

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Instant payments',
    description: 'Funds settle in minutes, not days. No more waiting for bank transfers.',
    gradient: 'from-amber-500 to-orange-500'
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Smart splitting',
    description: 'Groups split by item, equally, or custom amounts. Perfect for shared experiences.',
    gradient: 'from-blue-500 to-indigo-500'
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: 'Competitive rates',
    description: '2.5% per transaction with volume discounts. No hidden fees, no surprises.',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Real-time analytics',
    description: 'Know your business with live sales data, customer insights, and trends.',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Works everywhere',
    description: 'From brick-and-mortar to pop-ups and events. Take payments anywhere.',
    gradient: 'from-cyan-500 to-teal-500'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Bank-level security',
    description: 'PCI compliant, 256-bit encryption. Your data is always protected.',
    gradient: 'from-red-500 to-rose-500'
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 px-4 bg-white">
      <div className="container max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-medium text-gray-400 tracking-wider uppercase mb-4 block"
          >
            Built for growth
          </motion.span>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-light mb-4"
          >
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
              scale payments
            </span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            No complex hardware. No hidden fees. Just a beautiful platform that works for any business.
          </motion.p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group relative p-8 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 bg-white"
            >
              {/* Icon with gradient */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>

              <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>

              {/* Decorative line */}
              <div className="absolute bottom-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-16"
        >
          <p className="text-gray-400">
            Trusted by restaurants, retailers, and{' '}
            <button className="text-black font-medium hover:underline">
              innovative businesses →
            </button>
          </p>
        </motion.div>
      </div>
    </section>
  );
}