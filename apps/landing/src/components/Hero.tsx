import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-24 px-4 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-gray-50 -z-10" />
      
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.02] -z-10" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, black 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="container max-w-6xl mx-auto relative">
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <span className="inline-flex items-center gap-2 bg-black/5 text-black text-sm px-4 py-2 rounded-full">
            <Sparkles className="w-4 h-4" />
            Payment infrastructure for modern businesses
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-light text-center tracking-tight mb-6"
        >
          Get paid{' '}
          <span className="relative">
            <span className="relative z-10 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
              instantly
            </span>
            <span className="absolute bottom-2 left-0 right-0 h-3 bg-yellow-200 -z-0 opacity-50" />
          </span>
          ,{' '}
          <br className="hidden sm:block" />
          grow faster
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-gray-400 text-center max-w-2xl mx-auto mb-12 font-light"
        >
          From restaurants to retail, pop-ups to e-commerce — 
          Drift handles payments, splitting, and payouts in one unified platform.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <button
            onClick={() => navigate('/signup')}
            className="group px-8 py-4 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-300 text-lg font-light flex items-center justify-center gap-2 min-w-[200px]"
          >
            Start building
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-8 py-4 bg-white text-black border border-gray-200 rounded-full hover:border-black transition-all duration-300 text-lg font-light min-w-[200px]"
          >
            See how it works
          </button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="flex items-center gap-8 text-sm text-gray-300">
            <span>⚡ 14-day free trial</span>
            <span>🔒 No credit card required</span>
            <span>🚀 Cancel anytime</span>
          </div>

          {/* Company logos */}
          <div className="flex items-center justify-center gap-8 opacity-30 grayscale">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-8 w-24 bg-gray-200 rounded" />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}