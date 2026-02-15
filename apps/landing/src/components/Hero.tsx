import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Hero() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLearnMore = () => {
    const featuresSection = document.getElementById('features');
    featuresSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="pt-24 pb-16 px-4">
      <div className="container max-w-5xl mx-auto">
        {/* Brand mark */}
        <div className="text-center mb-16">
          <span className="text-sm font-medium text-gray-400 tracking-[0.2em] uppercase">
            drift
          </span>
        </div>

        {/* Main headline - keeps the brand identity */}
        <div className="text-center mb-8">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-light tracking-tight text-gray-900 mb-6">
            eat · drink ·{' '}
            <span className="italic font-light text-gray-900">drift</span>
          </h1>
          
          {/* Value proposition - specific enough for current users, broad enough for future */}
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-light tracking-wide">
            Payment infrastructure for restaurants, bars, and beyond
          </p>
        </div>

        {/* Description - shows the breadth of use cases */}
        <div className="text-center mb-12">
          <p className="text-base text-gray-300 max-w-2xl mx-auto font-light tracking-wide">
            From dinner tables to coffee counters, pop-ups to market stalls — 
            handle payments, split bills, and get paid faster.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button
            onClick={handleGetStarted}
            className="group inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white text-base font-medium rounded-full hover:bg-gray-800 transition-all duration-300 min-w-[200px]"
          >
            <span>Start free trial</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={handleLearnMore}
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-600 text-base font-medium rounded-full border border-gray-200 hover:border-gray-300 hover:text-gray-900 transition-all duration-300 min-w-[200px]"
          >
            See how it works
          </button>
        </div>

        {/* Trust indicators - industry agnostic */}
        <div className="text-center">
          <p className="text-xs text-gray-300 font-light tracking-wide">
            14-day free trial · No credit card required · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}