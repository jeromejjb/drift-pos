import { QrCode, Smartphone, Users, CreditCard, ArrowRight } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: <QrCode className="w-8 h-8" />,
      title: "1. Scan & connect",
      description: "Customers scan a QR code at their table, bar, or counter. No app download required — just open their camera and they're in.",
      details: "Works with any smartphone. No accounts, no passwords."
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "2. Browse & order",
      description: "Customers see your full menu, customize items, and place orders directly from their phone. Real-time updates to your kitchen.",
      details: "Special requests, modifiers, and quantities all handled instantly."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "3. Split or claim",
      description: "Groups can split bills by item, equally, or custom amounts. Perfect for friends sharing appetizers or couples dining together.",
      details: "Each person pays for exactly what they ordered — no awkward math."
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "4. Pay & go",
      description: "One tap pays the bill. Tips included. Customers get a digital receipt via text or email. No waiting for the check.",
      details: "Secure payments processed instantly. Lower fees than traditional POS."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 bg-white">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <span className="text-sm font-medium text-gray-400 tracking-[0.2em] uppercase">
            simple by design
          </span>
        </div>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light text-gray-900 mb-4">
            How Drift works
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto font-light">
            From first scan to final payment — everything happens in seconds, not minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line (except last) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5">
                  <div className="relative">
                    <div className="absolute top-0 left-0 w-16 h-0.5 bg-gray-200">
                      <ArrowRight className="absolute -right-2 -top-2 w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-center">
                {/* Icon circle */}
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
                  <div className="text-gray-700">
                    {step.icon}
                  </div>
                </div>
                
                {/* Step title */}
                <h3 className="text-xl font-light text-gray-900 mb-3">
                  {step.title}
                </h3>
                
                {/* Main description */}
                <p className="text-gray-500 text-sm mb-3 leading-relaxed">
                  {step.description}
                </p>
                
                {/* Additional detail */}
                <p className="text-xs text-gray-400 italic">
                  {step.details}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Visual demo section */}
        <div className="bg-gray-50 rounded-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left side - customer view */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-6 border border-gray-200">
                <Smartphone className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Customer experience</span>
              </div>
              
              <h4 className="text-2xl font-light text-gray-900 mb-4">
                What your customers see
              </h4>
              
              <ul className="space-y-4">
                {[
                  'Clean menu with photos and descriptions',
                  'Real-time order status updates',
                  'Easy bill splitting with friends',
                  'Digital receipts via text or email'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-500 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right side - business view */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-6 border border-gray-200">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Business dashboard</span>
              </div>
              
              <h4 className="text-2xl font-light text-gray-900 mb-4">
                What you get
              </h4>
              
              <ul className="space-y-4">
                {[
                  'Real-time order notifications',
                  'Kitchen display system integration',
                  'Customer insights and analytics',
                  'Lower transaction fees than traditional POS'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-500 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Stats preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-light text-gray-900">15 sec</div>
              <div className="text-xs text-gray-400">Average scan to order</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-gray-900">98%</div>
              <div className="text-xs text-gray-400">Customers prefer digital</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-gray-900">30%</div>
              <div className="text-xs text-gray-400">Faster table turnover</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-gray-900">24/7</div>
              <div className="text-xs text-gray-400">Orders anytime</div>
            </div>
          </div>
        </div>

        {/* FAQ teaser */}
        <div className="text-center mt-16">
          <p className="text-sm text-gray-400">
            Have more questions?{' '}
            <a href="#faq" className="text-gray-900 border-b border-gray-300 hover:border-gray-900 transition-colors">
              Check our FAQ
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}