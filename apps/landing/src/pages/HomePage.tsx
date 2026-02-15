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
      
      {/* Remove the fake stats section completely */}
      
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