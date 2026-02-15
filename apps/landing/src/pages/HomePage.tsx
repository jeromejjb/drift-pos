import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { RestaurantShowcase } from '../components/RestaurantShowcase';
import { DinerShowcase } from '../components/DinerShowcase';
import { Testimonials } from '../components/Testimonials';
import { Pricing } from '../components/Pricing';
import { FAQ } from '../components/FAQ';
import { CTA } from '../components/CTA';
import { Footer } from '../components/Footer';

export function HomePage() {
  return (
    <div className="drift-container overflow-hidden">
      {/* Drift background layers for ambient effect */}
      <div className="drift-layer-1 opacity-30"></div>
      <div className="drift-layer-2 opacity-20"></div>
      <div className="drift-layer-3 opacity-10"></div>
      
      {/* Main content with drift effects */}
      <div className="relative z-10">
        <Navbar />
        <div className="animate-drift-smooth">
          <Hero />
        </div>
        <div className="animate-drift-organic">
          <Features />
        </div>
        <div className="animate-drift-float">
          <RestaurantShowcase />
        </div>
        <div className="animate-drift-pulse">
          <DinerShowcase />
        </div>
        <Testimonials />
        <Pricing />
        <FAQ />
        <div className="drift-card border-0 rounded-none">
          <CTA />
        </div>
        <Footer />
      </div>
    </div>
  );
}