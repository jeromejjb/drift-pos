import { motion } from 'framer-motion';
import { ArrowRight, Building2, Zap, Users, Globe, TrendingUp, Award, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-6xl md:text-7xl font-light mb-6">
              We're building the
              <br />
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
                  future of payments
                </span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-yellow-200 -z-0 opacity-30" />
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From restaurants to retail, we're making payments invisible, 
              instant, and fair for every business.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {[
              { number: '500+', label: 'Businesses', icon: Building2 },
              { number: '$50M+', label: 'Processed', icon: TrendingUp },
              { number: '47', label: 'States', icon: Globe },
              { number: '4.9', label: 'Rating', icon: Award },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <Icon className="w-6 h-6 mx-auto mb-3 text-gray-300" />
                  <div className="text-3xl font-light text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-light mb-4">Our story</h2>
            <p className="text-gray-400">It started with a frustrating dinner bill.</p>
          </motion.div>

          <div className="prose prose-lg mx-auto text-gray-600 space-y-6">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Four friends. One check. Twenty minutes of awkward math. 
              We knew there had to be a better way.
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
            >
              That night, Drift was born. Not just to split bills, but to 
              reimagine how businesses get paid. No more clunky hardware. 
              No more hidden fees. No more waiting days for your money.
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Today, we're a team of builders, designers, and dreamers 
              working out of coffee shops and coworking spaces across the 
              Great Lakes region. We're not in Silicon Valley — and we 
              wouldn't have it any other way.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-light text-center mb-12"
          >
            What we believe
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Speed first',
                description: 'Your money should move as fast as your business. No more waiting days for payouts.'
              },
              {
                icon: Heart,
                title: 'Built for you',
                description: 'We started with restaurants, but we\'re building for every business that deserves better.'
              },
              {
                icon: Users,
                title: 'Radical transparency',
                description: 'No hidden fees. No fine print. Just honest pricing you can understand.'
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
                  className="text-center p-8"
                >
                  <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-medium mb-4">{value.title}</h3>
                  <p className="text-gray-400">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section - Minimal for now */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-light mb-4">Meet the team</h2>
            <p className="text-gray-400 mb-12">
              We're a small but mighty team spread across the Great Lakes.
            </p>
            
            {/* Simple placeholder for now - can expand later */}
            <div className="flex justify-center gap-4 flex-wrap">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-32 h-32 bg-gray-200 rounded-full" />
              ))}
            </div>
            
            <p className="text-sm text-gray-300 mt-8">
              We're growing — and always looking for talented people.
            </p>
            <button
              onClick={() => navigate('/careers')}
              className="mt-4 inline-flex items-center gap-2 text-black hover:text-gray-600 transition-colors"
            >
              Join us <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}