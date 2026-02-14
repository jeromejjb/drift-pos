import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="container max-w-4xl mx-auto text-center">
        <h2 className="text-5xl font-light mb-4">Ready to drift?</h2>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Join hundreds of restaurants already using Drift to create better experiences for their customers.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-black text-white px-8 py-4 rounded-full text-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
            Start free trial
            <ArrowRight className="w-5 h-5" />
          </button>
          <button className="bg-white border border-gray-200 px-8 py-4 rounded-full text-lg hover:border-black transition-colors">
            Schedule a demo
          </button>
        </div>

        <p className="text-sm text-gray-400 mt-6">
          No credit card required · 30-day free trial · Cancel anytime
        </p>
      </div>
    </section>
  );
}