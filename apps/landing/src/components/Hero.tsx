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
    <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="container max-w-6xl mx-auto text-center">
        {/* Professional badge */}
        <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full mb-8 animate-fade-in">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium text-gray-600">Professional payment infrastructure for restaurants</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-6 animate-fade-in text-primary">
          The complete financial stack for<br />
          <span className="bg-gradient-primary bg-clip-text text-transparent font-normal">
            growing restaurants
          </span>
        </h1>
        
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-12 animate-slide-up leading-relaxed">
          From first order to final payment — handle everything in one place. 
          Start your 14-day trial today, no credit card required.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
          <button 
            onClick={handleGetStarted}
            className="fin-btn-primary text-base px-8 py-4 cursor-pointer group"
          >
            <span className="flex items-center gap-2">
              Start free trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          <button 
            onClick={handleLearnMore}
            className="fin-btn-secondary text-base px-8 py-4 cursor-pointer"
          >
            See how it works
          </button>
        </div>

        {/* Trial badge */}
        <div className="mt-8 text-sm text-gray-400">
          ✨ 14-day free trial • No credit card needed • Cancel anytime
        </div>
      </div>
    </section>
  );
}