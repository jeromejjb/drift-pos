import { ArrowRight, } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-24 px-4 overflow-hidden bg-white">
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, black 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="container max-w-5xl mx-auto text-center relative">
        {/* Removed fake "500+ businesses" badge */}

        {/* Main headline - clean and bold */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-light mb-6 leading-tight"
        >
          <span className="block text-gray-900">Payments for</span>
          <span className="block text-gray-900">business.</span>
          <span className="relative mt-4 block">
            <span className="relative z-10 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
              Finally done right.
            </span>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 h-3 bg-yellow-200 -z-0 opacity-30" />
          </span>
        </motion.h1>

        {/* Clean value proposition */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-gray-400 max-w-2xl mx-auto mb-12"
        >
          One platform. One rate. No hidden fees.
          <br />
          Built for restaurants, retail, and everything in between.
        </motion.p>

        {/* Stats row - honest and forward-looking */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex justify-center gap-12 mb-12"
        >
          <div className="text-center">
            <div className="text-2xl font-light text-gray-900">2.5%</div>
            <div className="text-sm text-gray-400">Base rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-light text-gray-900">1.5%</div>
            <div className="text-sm text-gray-400">At volume</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-light text-gray-900">Coming 2026</div>
            <div className="text-sm text-gray-400">First restaurants</div>
          </div>
        </motion.div>

        {/* CTA Buttons - premium feel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <button
            onClick={() => navigate('/signup')}
            className="group px-8 py-4 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-300 text-lg font-light flex items-center justify-center gap-2 min-w-[200px]"
          >
            Get early access
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

        {/* Simple trust signal - honest and transparent */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-sm text-gray-300"
        >
          <span>Early access · No credit card required</span>
        </motion.div>
      </div>
    </section>
  );
}