import { Smartphone, Users, CreditCard, Clock, ShoppingBag, Coffee, Store, Pizza } from 'lucide-react';

const features = [
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "One tap payments",
    description: "Customers pay instantly from their phone. No apps to download, no accounts to create.",
    useCases: ["Restaurants", "Bars", "Coffee shops", "Food carts"]
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Smart bill splitting",
    description: "Split by item, equally, or custom amounts. Perfect for groups anywhere.",
    useCases: ["Dinner tables", "Bar tabs", "Group orders", "Events"]
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "Competitive rates",
    description: "One monthly fee plus low transaction fees. No hidden costs, no surprises.",
    useCases: ["Pop-ups", "Market stalls", "Small businesses", "Growing brands"]
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Faster transactions",
    description: "Reduce wait times and increase turnover. Serve more customers, earn more revenue.",
    useCases: ["Busy nights", "Lunch rushes", "Weekend markets", "Peak hours"]
  },
  {
    icon: <ShoppingBag className="w-6 h-6" />,
    title: "Works everywhere",
    description: "From brick-and-mortar to pop-ups and events. Take payments wherever you are.",
    useCases: ["Food trucks", "Farmers markets", "Temporary events", "Mobile businesses"]
  },
  {
    icon: <Store className="w-6 h-6" />,
    title: "All-in-one platform",
    description: "Manage orders, payments, and staff in a single dashboard. No complex hardware needed.",
    useCases: ["Multi-location", "Single shops", "Co-working cafes", "Breweries"]
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 px-4 bg-white">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-4">
          <span className="text-sm font-medium text-gray-400 tracking-[0.2em] uppercase">
            built for any business
          </span>
        </div>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light text-gray-900 mb-4">
            From restaurants to pop-ups
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto font-light">
            Wherever you do business, Drift helps you get paid faster.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="group p-8 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 text-gray-600 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">{feature.description}</p>
              
              {/* Use case tags - shows breadth without being limiting */}
              <div className="flex flex-wrap gap-2 mt-4">
                {feature.useCases.slice(0, 2).map((useCase, idx) => (
                  <span key={idx} className="text-xs text-gray-300">
                    {useCase}{idx < 1 ? ' · ' : ''}
                  </span>
                ))}
                <span className="text-xs text-gray-300">and more</span>
              </div>
            </div>
          ))}
        </div>

        {/* Breadth statement */}
        <div className="text-center mt-16">
          <p className="text-sm text-gray-400">
            Trusted by restaurants, bars, coffee shops, food trucks, market vendors, and more.
          </p>
        </div>
      </div>
    </section>
  );
}