import { useState } from 'react';
import { ArrowRight, Smartphone, Store, CreditCard, QrCode, Menu, Banknote, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function Hero() {
  const navigate = useNavigate();
  const [view, setView] = useState<'diner' | 'owner'>('diner');
  const [waitlistCount] = useState(47);

  const dinerSteps = [
    { icon: <Smartphone className="w-5 h-5" />, text: 'Scan' },
    { icon: <Menu className="w-5 h-5" />, text: 'Browse' },
    { icon: <CreditCard className="w-5 h-5" />, text: 'Order' },
    { icon: <CreditCard className="w-5 h-5" />, text: 'Pay' },
  ];

  const ownerSteps = [
    { icon: <Store className="w-5 h-5" />, text: 'Start' },
    { icon: <Menu className="w-5 h-5" />, text: 'Menu' },
    { icon: <QrCode className="w-5 h-5" />, text: 'Print' },
    { icon: <Banknote className="w-5 h-5" />, text: 'Paid' },
  ];

  const steps = view === 'diner' ? dinerSteps : ownerSteps;

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
        {/* Early access badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-800 text-sm px-4 py-2 rounded-full mb-8"
        >
          <Clock className="w-4 h-4" />
          <span>Early access · {waitlistCount}+ restaurants waiting</span>
        </motion.div>

        {/* Main headline */}
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

        {/* Value prop */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-gray-400 max-w-2xl mx-auto mb-8"
        >
          One platform. One rate. No hidden fees.
          <br />
          Built for restaurants, retail, and everything in between.
        </motion.p>

        {/* Toggle - Prominent in hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-gray-100 p-1 rounded-full inline-flex shadow-sm">
            <button
              onClick={() => setView('diner')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                view === 'diner' 
                  ? 'bg-black text-white shadow-md' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              👤 For diners
            </button>
            <button
              onClick={() => setView('owner')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                view === 'owner' 
                  ? 'bg-black text-white shadow-md' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🏢 For owners
            </button>
          </div>
        </motion.div>

        {/* Animated steps - ONE WORD each */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center gap-6 mb-8"
        >
          <AnimatePresence mode="wait">
            {steps.map((step, i) => (
              <motion.div
                key={`${view}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white mb-1">
                  {step.icon}
                </div>
                <span className="text-xs text-gray-500">{step.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Tagline - flows naturally */}
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-400 mb-8"
        >
          {view === 'diner' 
            ? 'Scan. Browse. Order. Pay.' 
            : 'Start. Menu. Print. Paid.'}
        </motion.div>

        {/* Stats row */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex justify-center gap-12 mb-8"
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
            <div className="text-2xl font-light text-gray-900">Q2 2026</div>
            <div className="text-sm text-gray-400">Launching Midwest</div>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
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

        {/* Great Lakes cities - Milwaukee FIRST! */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex items-center justify-center gap-4 text-xs text-gray-300 flex-wrap"
        >
          <span className="flex items-center gap-1">📍 Milwaukee</span>
          <span className="flex items-center gap-1">📍 Chicago</span>
          <span className="flex items-center gap-1">📍 Detroit</span>
          <span className="flex items-center gap-1">📍 Cleveland</span>
          <span className="flex items-center gap-1 text-black font-medium">📍 Your city?</span>
        </motion.div>

        {/* Fine print */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-xs text-gray-200 mt-6"
        >
          No credit card required · Free during early access
        </motion.div>
      </div>
    </section>
  );
}