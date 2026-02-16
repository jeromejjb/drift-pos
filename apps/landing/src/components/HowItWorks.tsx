import { motion } from 'framer-motion';
import { QrCode, Smartphone, Users, CreditCard, BarChart3, Layout, Sparkles } from 'lucide-react';
import { useState } from 'react';

const steps = [
  {
    icon: <QrCode className="w-8 h-8" />,
    title: '1. Scan',
    description: 'Customers scan the QR code at their table',
    details: 'Works with any smartphone camera. No app download.'
  },
  {
    icon: <Smartphone className="w-8 h-8" />,
    title: '2. Browse',
    description: 'View the full menu with photos and descriptions',
    details: 'Real-time updates to the kitchen.'
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: '3. Order',
    description: 'Each person orders from their own phone',
    details: 'Special requests and modifications handled instantly.'
  },
  {
    icon: <CreditCard className="w-8 h-8" />,
    title: '4. Pay',
    description: 'One tap pays the bill. Digital receipt via text.',
    details: 'Split items, split evenly, or pay your own way.'
  }
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how-it-works" className="py-24 px-4 bg-gray-50">
      <div className="container max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-medium text-gray-400 tracking-wider uppercase mb-4 block"
          >
            Simple by design
          </motion.span>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-light mb-4"
          >
            From scan to pay{' '}
            <span className="bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
              in seconds
            </span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            Scan. Browse. Order. Pay.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent hidden lg:block" />

          <div className="grid lg:grid-cols-4 gap-8 relative">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
                onMouseEnter={() => setActiveStep(i)}
              >
                {/* Step number - darker */}
                <div className="lg:hidden text-7xl font-light text-gray-200 absolute -top-8 -left-2 -z-10">
                  {i + 1}
                </div>

                <div className={`bg-white rounded-2xl p-8 shadow-sm border transition-all duration-300 relative z-10 h-full flex flex-col ${
                  activeStep === i ? 'border-black shadow-xl scale-105' : 'border-gray-100 hover:shadow-xl'
                }`}>
                  {/* Icon */}
                  <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 text-white">
                    {step.icon}
                  </div>

                  <h3 className="text-xl font-medium mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed flex-grow">{step.description}</p>
                  <p className="text-xs text-gray-400 mt-auto">{step.details}</p>
                </div>

                {/* Desktop step number - darker */}
                <div className="hidden lg:block absolute -bottom-8 left-1/2 -translate-x-1/2 text-6xl font-light text-gray-300">
                  {i + 1}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Demo preview - side by side with COOLER business icon */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-20 bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* Customer view */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Smartphone className="w-4 h-4" />
                <span>What diners see</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-black to-gray-700 rounded-lg flex items-center justify-center">
                    <Layout className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">Trattoria Bellini</div>
                    <div className="text-xs text-gray-400">Table 3 · 2 guests</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Margherita pizza</span>
                    <span className="font-medium">$18</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Calamari</span>
                    <span className="font-medium">$14</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Your share</span>
                      <span>$16</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business view - with COOLER icon and customization hint */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <BarChart3 className="w-4 h-4" />
                  <span>What owners see</span>
                </div>
                
                {/* Customization badge - subtle hint of future feature */}
                <div className="flex items-center gap-1 text-xs text-gray-300">
                  <Sparkles className="w-3 h-3" />
                  <span>Customize in dashboard</span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium">Today's orders</span>
                  <span className="text-2xl font-light">24</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Table 3 · 2 items</span>
                    <span className="font-medium">$42</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Table 7 · 3 items</span>
                    <span className="font-medium">$56</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Table 2 · 1 item</span>
                    <span className="font-medium">$22</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total today</span>
                    <span>$2,847</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}