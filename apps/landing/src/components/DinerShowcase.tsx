import { Pizza, Check } from 'lucide-react'; // Removed Smartphone and QrCode

export function DinerShowcase() {
  return (
    <section id="diners" className="py-20 bg-gray-50 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Phone Mockup */}
          <div className="relative">
            <div className="bg-white rounded-3xl border border-gray-200 p-4 shadow-xl max-w-sm mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-black rounded-full"></div>
                <div>
                  <div className="font-medium">Trattoria Bellini</div>
                  <div className="text-xs text-gray-400">Table 3 · 2 guests</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Margherita</span>
                  <span>$18</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Calamari</span>
                  <span>$14</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Pizza className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm">Pizza coming! Tap slices:</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className="w-6 h-6 bg-white rounded-full border border-gray-200 flex items-center justify-center text-xs">
                      {i}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-4xl font-light mb-4">Perfect for diners</h2>
            <p className="text-gray-400 mb-6">
              No more awkward math. No more waiting for the check. 
              Just good food with good people.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-600">Pay with Apple Pay or card</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-600">Split shared items instantly</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-600">Leave when you're done</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-600">No app to download</span>
              </div>
            </div>

            <button className="mt-8 bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors">
              Find a Drift restaurant →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}