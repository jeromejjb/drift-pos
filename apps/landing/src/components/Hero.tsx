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
        {/* Brand mark - subtle and professional */}
        <div className="text-center mb-16">
          <span className="text-sm font-medium text-gray-400 tracking-widest uppercase">
            drift
          </span>
        </div>

        {/* Main headline - clean and bold */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-light tracking-tight text-gray-900 mb-4">
            eat · drink · <span className="italic font-normal">drift</span>
          </h1>
          
          {/* Value proposition - single line, clean */}
          <p className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto">
            The financial stack for modern restaurants
          </p>
        </div>

        {/* Description - clean and simple */}
        <div className="text-center mb-12">
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            From first order to final payment — handle everything in one place.
          </p>
        </div>

        {/* CTA Buttons - clean layout */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white text-lg rounded-full hover:bg-gray-800 transition-colors min-w-[200px] group"
          >
            <span>Start free trial</span>
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={handleLearnMore}
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 text-lg rounded-full border border-gray-200 hover:border-gray-300 transition-colors min-w-[200px]"
          >
            See how it works
          </button>
        </div>

        {/* Trust indicators - clean and minimal */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            14-day free trial · No credit card required · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}