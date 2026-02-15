import { QrCode, Smartphone, Users, CreditCard, ArrowRight } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: <QrCode className="w-8 h-8" />,
      title: "Scan & connect",
      description: "Customers scan a QR code at their table, bar, or counter. No app download required.",
      details: "Works with any smartphone. No accounts, no passwords."
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Browse & order",
      description: "Customers see your full menu and place orders directly from their phone.",
      details: "Special requests and modifiers handled instantly."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Split or claim",
      description: "Groups can split bills by item, equally, or custom amounts.",
      details: "Each person pays for exactly what they ordered."
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Pay & go",
      description: "One tap pays the bill. Digital receipt via text or email.",
      details: "Secure payments processed instantly."
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

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Step number indicator */}
              <div className="text-5xl font-light text-gray-100 absolute -top-6 -left-2 -z-10">
                0{index + 1}
              </div>
              
              <div>
                {/* Icon */}
                <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 text-white">
                  {step.icon}
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-light text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm mb-3 leading-relaxed">
                  {step.description}
                </p>
                <p className="text-xs text-gray-400">
                  {step.details}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Demo preview */}
        <div className="bg-gray-50 rounded-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left side - phone mockup */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white text-xs">
                  📱
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Customer view</div>
                  <div className="text-xs text-gray-400">What your customers see</div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  'Menu with photos',
                  'Real-time order status',
                  'Easy bill splitting',
                  'Digital receipt'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-green-500 text-sm">✓</span>
                    <span className="text-xs text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side - business dashboard */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white text-xs">
                  📊
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Business dashboard</div>
                  <div className="text-xs text-gray-400">What you get</div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  'Real-time notifications',
                  'Kitchen display',
                  'Customer insights',
                  'Lower fees'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-green-500 text-sm">✓</span>
                    <span className="text-xs text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}