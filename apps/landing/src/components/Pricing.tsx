import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Pricing() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 px-4 bg-white">
      <div className="container max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-medium text-gray-400 tracking-wider uppercase mb-4 block"
          >
            Transparent pricing
          </motion.span>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-light mb-4"
          >
            One simple rate.{' '}
            <span className="bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
              No surprises.
            </span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            Everything you need to start accepting payments today.
          </motion.p>
        </div>

        {/* Pricing card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="max-w-md mx-auto"
        >
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-xl hover:shadow-2xl transition-shadow">
            {/* Badge */}
            <div className="inline-block bg-black text-white text-sm px-3 py-1 rounded-full mb-6">
              Early access pricing
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-light">$97</span>
                <span className="text-gray-400">/month</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                plus 1.5% per transaction
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-4 mb-8">
              {[
                'Unlimited orders',
                'Real-time analytics',
                'Automated bill splitting',
                'Customer payment portal',
                'Priority support',
                'Daily settlements'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => navigate('/signup')}
              className="w-full bg-black text-white py-4 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group"
            >
              Start your 14-day trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              No credit card required · Cancel anytime
            </p>
          </div>

          {/* Annual option */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-400">
              Save 20% with annual billing ·{' '}
              <button className="text-black font-medium hover:underline">
                Contact sales
              </button>
            </p>
          </div>
        </motion.div>

        {/* Enterprise note */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-gray-400">
            Processing over $100k/month?{' '}
            <button className="text-black font-medium hover:underline">
              Talk to our team →
            </button>
          </p>
        </motion.div>
      </div>
    </section>
  );
}