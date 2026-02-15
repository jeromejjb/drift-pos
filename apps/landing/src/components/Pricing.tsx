import { Check } from 'lucide-react';

export function Pricing() {
  return (
    <section className="py-24 px-4 bg-gray-50">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light text-primary mb-4">Simple, transparent pricing</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Everything you need to manage your restaurant's payments in one place
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="fin-card text-center">
            {/* Professional badge */}
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium mb-6">
              Early access pricing
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-primary mb-2">Professional</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-light">$97</span>
                <span className="text-gray-400">/month</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">plus 1.5% per transaction</p>
            </div>

            <ul className="space-y-4 mb-8 text-left">
              {[
                'Unlimited orders',
                'Unlimited team members',
                'Real-time analytics dashboard',
                'Customer payment portal',
                'Automated bill splitting',
                'Priority email & chat support',
                'Regular feature updates'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>

            <button className="fin-btn-primary w-full">
              Start your 14-day trial
            </button>

            <p className="text-xs text-gray-400 mt-4">
              No credit card required • Cancel anytime
            </p>
          </div>

          {/* Optional: Annual option */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Save 20% with annual billing •{' '}
              <button className="text-accent hover:underline">Contact sales</button>
            </p>
          </div>
        </div>

        {/* Feature comparison note */}
        <div className="text-center mt-16">
          <p className="text-sm text-gray-400">
            Need custom features or higher volume?{' '}
            <button className="text-accent hover:underline">Talk to our team</button>
          </p>
        </div>
      </div>
    </section>
  );
}