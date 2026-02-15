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
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      
      {/* Subtle separator */}
      <div className="fin-divider max-w-7xl mx-auto" />
      
      <Features />
      
      {/* Professional metric highlight section */}
      <div className="bg-gradient-surface py-16 my-8">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="fin-metric-card text-center">
              <div className="fin-stat">$2.5B+</div>
              <div className="fin-stat-label">Processed annually</div>
            </div>
            <div className="fin-metric-card text-center">
              <div className="fin-stat">99.9%</div>
              <div className="fin-stat-label">Uptime SLA</div>
            </div>
            <div className="fin-metric-card text-center">
              <div className="fin-stat">5,000+</div>
              <div className="fin-stat-label">Restaurants</div>
            </div>
          </div>
        </div>
      </div>
      
      <RestaurantShowcase />
      <DinerShowcase />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}