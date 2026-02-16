import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Blog() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h1 className="text-6xl md:text-7xl font-light mb-4">
              The Drift
              <br />
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
                  Blog
                </span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-yellow-200 -z-0 opacity-30" />
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Thoughts on payments, business, and building in public.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center bg-white rounded-3xl p-16 border border-gray-100"
          >
            <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-light mb-4">Stories brewing</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              We're cooking up our first posts. Check back soon for insights on payments, 
              business growth, and building Drift in public.
            </p>
            
            {/* Newsletter signup */}
            <div className="max-w-md mx-auto">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Get notified when we post"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black"
                />
                <button className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                No spam. Just good reads. Unsubscribe anytime.
              </p>
            </div>
          </motion.div>

          {/* Placeholder posts - visual interest only */}
          <div className="grid md:grid-cols-2 gap-6 mt-12 opacity-30">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-100">
                <div className="w-full h-40 bg-gray-100 rounded-lg mb-4" />
                <div className="h-6 w-3/4 bg-gray-100 rounded mb-2" />
                <div className="h-4 w-1/2 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}