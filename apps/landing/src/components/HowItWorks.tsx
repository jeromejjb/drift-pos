import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { QrCode, Smartphone, Users, CreditCard } from 'lucide-react';
import { useState } from 'react';

const steps = [
  {
    icon: <QrCode className="w-6 h-6" />,
    title: '1. Scan',
    description: 'Customers scan the QR code at their table',
    details: 'Works with any smartphone camera. No app download.'
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: '2. Browse',
    description: 'View the full menu with photos and descriptions',
    details: 'Real-time updates to the kitchen.'
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: '3. Order',
    description: 'Each person orders from their own phone',
    details: 'Special requests and modifications handled instantly.'
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: '4. Pay',
    description: 'One tap pays the bill. Digital receipt via text.',
    details: 'Split items, split evenly, or pay your own way.'
  }
];

// Animation variants for dropping numbers - properly typed
const dropVariants: Variants = {
  hidden: { 
    y: -100, 
    opacity: 0,
    rotate: -10
  },
  visible: (i: number) => ({ 
    y: 0, 
    opacity: 1,
    rotate: 0,
    transition: { 
      type: "spring" as const,
      stiffness: 200,
      damping: 15,
      delay: i * 0.15
    }
  })
};

export function HowItWorks() {
  // Use state for hover interactions
  const [, setActiveStep] = useState(0);

  return (
    <section id="how-it-works" className="py-24 px-4 bg-white overflow-hidden">
      <div className="container max-w-6xl mx-auto">
        {/* Section header - matching the image */}
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm text-gray-400 tracking-wider uppercase mb-4 block"
          >
            SIMPLE BY DESIGN
          </motion.span>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-light text-gray-900 mb-4"
          >
            From scan to pay{' '}
            <span className="text-gray-900">in seconds</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            Scan. Browse. Order. Pay.
          </motion.p>
        </div>

        {/* Steps with dropping numbers */}
        <div className="relative mb-20">
          {/* Background numbers with drop animation */}
          <div className="absolute inset-0 flex justify-between px-4 pointer-events-none overflow-hidden">
            {[1, 2, 3, 4].map((num, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={dropVariants}
                className="text-[200px] font-bold text-gray-50 -mt-20 select-none"
                style={{ 
                  marginLeft: i === 0 ? '-20px' : 'auto',
                  marginRight: i === 3 ? '-20px' : 'auto'
                }}
              >
                {num}
              </motion.div>
            ))}
          </div>

          {/* Foreground content */}
          <div className="grid md:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.3 }}
                className="text-center bg-white/80 backdrop-blur-sm p-6 rounded-2xl"
                onMouseEnter={() => setActiveStep(i)}
                onMouseLeave={() => setActiveStep(-1)}
              >
                <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
                  {step.icon}
                </div>
                <h3 className="text-lg font-medium mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 mb-2">{step.description}</p>
                <p className="text-xs text-gray-400">{step.details}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Feature highlights - matching the bullet points in the image */}
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          {/* Left column - customer features */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">✓</div>
              <div>
                <p className="font-medium">Customers scan the QR code at their table</p>
                <p className="text-sm text-gray-400">Works with any smartphone camera. No app download.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">✓</div>
              <div>
                <p className="font-medium">View the full menu with photos and descriptions</p>
                <p className="text-sm text-gray-400">Real-time updates to the kitchen.</p>
              </div>
            </div>
          </motion.div>

          {/* Right column - ordering & payment features */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">✓</div>
              <div>
                <p className="font-medium">Each person orders from their own phone</p>
                <p className="text-sm text-gray-400">Special requests and modifications handled instantly.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">✓</div>
              <div>
                <p className="font-medium">One tap pays the bill. Digital receipt via text.</p>
                <p className="text-sm text-gray-400">Split items, split evenly, or pay your own way.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Simple visual - clean mockups */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-gray-50 rounded-3xl p-8 border border-gray-100 overflow-hidden"
        >
          {/* Decorative numbers in background */}
          <div className="absolute right-0 bottom-0 text-[150px] font-bold text-gray-100 select-none leading-none opacity-30">
            4
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 relative z-10">
            {/* Customer view - simple phone mockup */}
            <div>
              <div className="text-xs text-gray-400 mb-4">Customer view</div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white text-xs">1</div>
                  <div>
                    <div className="text-sm font-medium">Table 4</div>
                    <div className="text-xs text-gray-400">2 guests</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Margherita pizza</span>
                    <span>$18</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>House wine (2)</span>
                    <span>$24</span>
                  </div>
                  <div className="border-t border-gray-100 my-2"></div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total</span>
                    <span>$42</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Restaurant view - simple dashboard */}
            <div>
              <div className="text-xs text-gray-400 mb-4">Restaurant view</div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium">Live orders</span>
                  <span className="text-xs text-gray-400">12 active</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm">Table 3</span>
                    <span className="text-sm">$42</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm">Table 7</span>
                    <span className="text-sm">$56</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm">Table 2</span>
                    <span className="text-sm">$22</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Simple footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-xs text-gray-300 flex items-center justify-center gap-2">
            <span>1 · Scan</span>
            <span className="text-gray-200">|</span>
            <span>2 · Browse</span>
            <span className="text-gray-200">|</span>
            <span>3 · Order</span>
            <span className="text-gray-200">|</span>
            <span>4 · Pay</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}