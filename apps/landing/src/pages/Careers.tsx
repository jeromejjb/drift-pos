import { motion } from 'framer-motion';
import { Briefcase, Heart, Zap, Users } from 'lucide-react';
// Removed unused navigate

export function Careers() {
  // Removed unused navigate

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Briefcase className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h1 className="text-6xl md:text-7xl font-light mb-4">
              Join the
              <br />
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
                  Drift crew
                </span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-yellow-200 -z-0 opacity-30" />
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              We're building the future of payments — and we're looking for 
              builders who want to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-light mb-4">Why Drift?</h2>
            <p className="text-gray-400">We're small, intentional, and built differently.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Move fast',
                description: 'No red tape. No endless meetings. Just building things that matter.'
              },
              {
                icon: Heart,
                title: 'Build with heart',
                description: 'We care about our customers and each other. It shows.'
              },
              {
                icon: Users,
                title: 'Grow together',
                description: 'Your career grows as we grow. Equity for everyone.'
              }
            ].map((value, i) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center p-6 bg-white rounded-xl border border-gray-100"
                >
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-400">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 px-4">
        <div className="container max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-light mb-4">Open roles</h2>
            <p className="text-gray-400">We're growing — and we'd love to meet you.</p>
          </motion.div>

          {/* Coming Soon Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gray-50 rounded-3xl p-12 text-center border border-gray-100"
          >
            <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-white" />
            </div>
            
            <h3 className="text-2xl font-light mb-3">No open positions right now</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              We're a small team building in public. When we're ready to grow, 
              we'll post roles here. Want to be the first to know?
            </p>

            {/* Notify form */}
            <div className="max-w-md mx-auto">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black"
                />
                <button className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800">
                  Notify me
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                We'll only email when new roles open. No spam.
              </p>
            </div>
          </motion.div>

          {/* Speculative interest - for bold candidates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-400">
              Don't see a role but think you'd be a fit?{' '}
              <a href="mailto:careers@driftpos.com" className="text-black font-medium hover:underline">
                Say hello →
              </a>
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}