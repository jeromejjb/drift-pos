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
    <section className="pt-32 pb-20 px-4">
      <div className="container max-w-6xl mx-auto text-center">
        <h1 className="text-6xl md:text-8xl font-light tracking-tight mb-6 animate-fade-in">
          eat · drink · <span className="italic">drift</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 animate-slide-up">
          The simplest way for restaurants to handle orders and payments. 
          No apps. No awkward splitting. Just good food and good company.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
          <button 
            onClick={handleGetStarted}
            className="bg-black text-white px-8 py-4 rounded-full text-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            Start with Drift
            <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={handleLearnMore}
            className="bg-white border border-gray-200 px-8 py-4 rounded-full text-lg hover:border-black transition-colors cursor-pointer"
          >
            See how it works
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
          <div className="cursor-default">
            <div className="text-3xl font-light">50+</div>
            <div className="text-sm text-gray-400">Restaurants</div>
          </div>
          <div className="cursor-default">
            <div className="text-3xl font-light">10k+</div>
            <div className="text-sm text-gray-400">Happy Diners</div>
          </div>
          <div className="cursor-default">
            <div className="text-3xl font-light">$2M+</div>
            <div className="text-sm text-gray-400">Processed</div>
          </div>
          <div className="cursor-default">
            <div className="text-3xl font-light">4.9★</div>
            <div className="text-sm text-gray-400">Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
}