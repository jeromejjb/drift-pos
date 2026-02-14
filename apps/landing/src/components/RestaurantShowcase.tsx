import { Check, TrendingUp, Clock, DollarSign } from 'lucide-react';

export function RestaurantShowcase() {
  return (
    <section id="restaurants" className="py-20 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-light mb-4">Built for restaurants</h2>
            <p className="text-gray-400 mb-6">
              Faster table turns, happier customers, and zero walkouts. 
              Your staff spends less time on payments and more time on service.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-600">Tables turn 20% faster</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-600">No more chasing bills</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-600">Real-time order dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-600">Instant payouts</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center">
                <TrendingUp className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                <div className="text-xl font-light">20%</div>
                <div className="text-xs text-gray-400">faster tables</div>
              </div>
              <div className="text-center">
                <Clock className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                <div className="text-xl font-light">0</div>
                <div className="text-xs text-gray-400">walkouts</div>
              </div>
              <div className="text-center">
                <DollarSign className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                <div className="text-xl font-light">2x</div>
                <div className="text-xs text-gray-400">revenue</div>
              </div>
            </div>

            <button className="mt-8 bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors">
              Start with Drift →
            </button>
          </div>
          
          {/* Dashboard Preview */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-400">Today's orders</span>
              <span className="text-2xl font-light">24</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="text-sm font-medium">Table 3</span>
                  <p className="text-xs text-gray-400">2 items · Margherita, Calamari</p>
                </div>
                <span className="text-sm font-medium">$42</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="text-sm font-medium">Table 7</span>
                  <p className="text-xs text-gray-400">3 items · Diavola, Arancini</p>
                </div>
                <span className="text-sm font-medium">$56</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="text-sm font-medium">Table 2</span>
                  <p className="text-xs text-gray-400">1 item · Burrata</p>
                </div>
                <span className="text-sm font-medium">$22</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}