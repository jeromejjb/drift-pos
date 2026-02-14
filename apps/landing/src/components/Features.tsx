import { QrCode, Clock, Users, CreditCard, Zap, Shield } from 'lucide-react';

const features = [
  {
    icon: QrCode,
    title: 'Scan to start',
    description: 'Customers scan a QR code on the table. No app download needed.'
  },
  {
    icon: Clock,
    title: 'Order & pay instantly',
    description: 'Browse menu, order, and pay right from their phone.'
  },
  {
    icon: Users,
    title: 'Smart splitting',
    description: 'For shared items, everyone taps their portion and pays automatically.'
  },
  {
    icon: CreditCard,
    title: 'Instant payouts',
    description: 'Restaurants get paid directly to their bank account.'
  },
  {
    icon: Zap,
    title: 'Faster tables',
    description: 'Tables turn 20% faster with no waiting for checks.'
  },
  {
    icon: Shield,
    title: 'Secure payments',
    description: 'All payments are processed securely with Stripe.'
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-light text-center mb-4">Everything you need</h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          No more awkward bill splitting. No more waiting for checks. Just pure enjoyment.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-black transition-colors">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}