import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '0',
    description: 'Perfect for testing',
    features: [
      'Up to 10 tables',
      'Basic ordering',
      'Email support',
      'QR code generation'
    ]
  },
  {
    name: 'Pro',
    price: '49',
    description: 'For growing restaurants',
    features: [
      'Unlimited tables',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'Staff accounts',
      'Menu management'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For chains and groups',
    features: [
      'Multiple locations',
      'Dedicated account manager',
      'API access',
      'Custom integrations',
      'SLA guarantee'
    ]
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-gray-50 px-4">
      <div className="container max-w-6xl mx-auto">
        <h2 className="text-4xl font-light text-center mb-4">Simple, transparent pricing</h2>
        <p className="text-gray-400 text-center mb-12">No hidden fees. Cancel anytime.</p>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div key={i} className={`bg-white rounded-3xl p-6 border ${plan.popular ? 'border-black' : 'border-gray-100'}`}>
              {plan.popular && (
                <span className="text-xs bg-black text-white px-3 py-1 rounded-full mb-4 inline-block">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-medium mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-light">${plan.price}</span>
                {plan.price !== 'Custom' && <span className="text-gray-400">/mo</span>}
              </div>
              <p className="text-sm text-gray-400 mb-6">{plan.description}</p>
              
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button className={`w-full py-3 rounded-full transition-colors ${
                plan.popular 
                  ? 'bg-black text-white hover:bg-gray-800' 
                  : 'bg-white border border-gray-200 hover:border-black'
              }`}>
                Get started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}