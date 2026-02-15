import { Smartphone, Users, CreditCard, Clock, Shield, BarChart, Headset, Zap, Lock } from 'lucide-react';

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Unlimited orders",
    description: "Process as many orders as you want. No per-order fees, no limits."
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Smart bill splitting",
    description: "Split by item, equally, or custom amounts. Your customers decide how they want to pay."
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "Competitive rates",
    description: "1.5% per transaction — significantly lower than traditional processors."
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Faster table turnover",
    description: "Reduce wait times for bills and payments. Serve more customers, earn more revenue."
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Bank-grade security",
    description: "End-to-end encryption and compliance with the latest security standards."
  },
  {
    icon: <BarChart className="w-6 h-6" />,
    title: "Real-time analytics",
    description: "Understand your business with detailed insights and reporting dashboard."
  },
  {
    icon: <Headset className="w-6 h-6" />,
    title: "Priority support",
    description: "Get help when you need it with priority email and chat support."
  },
  {
    icon: <Lock className="w-6 h-6" />,
    title: "Team management",
    description: "Add unlimited staff members with role-based access controls."
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "Customer portal",
    description: "Diners can view receipts, split bills, and pay from their phones."
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 px-4 bg-white">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light text-primary mb-4">Everything you need in one platform</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            One monthly fee covers your entire team. No hidden costs, no surprises.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="fin-card group hover:border-accent/20">
              <div className="w-12 h-12 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl flex items-center justify-center mb-4 text-accent group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Value proposition summary */}
        <div className="mt-16 p-8 bg-gradient-surface rounded-2xl border border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-xl font-semibold text-primary mb-2">Why the monthly fee?</h4>
              <p className="text-gray-500 max-w-2xl">
                Unlike traditional processors that charge per feature or per user, Drift gives you 
                unlimited access to everything. One price covers your entire restaurant.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-primary">$97</div>
                <div className="text-xs text-gray-400">per month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-primary">1.5%</div>
                <div className="text-xs text-gray-400">transaction fee</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}