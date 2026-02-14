import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signup');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
      <div className="container max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - clickable to home */}
          <div 
            onClick={() => navigate('/')} 
            className="cursor-pointer"
          >
            <h1 className="text-2xl font-light tracking-tight">drift</h1>
            <p className="text-xs text-gray-400">eat · drink · drift</p>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-black transition-colors">Features</a>
            <a href="#restaurants" className="text-gray-600 hover:text-black transition-colors">Restaurants</a>
            <a href="#diners" className="text-gray-600 hover:text-black transition-colors">Diners</a>
            <a href="#pricing" className="text-gray-600 hover:text-black transition-colors">Pricing</a>
            <button 
              onClick={handleGetStarted}
              className="bg-black text-white px-6 py-2 rounded-full text-sm hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 animate-slide-down">
            <a href="#features" className="block py-2 text-gray-600 hover:text-black">Features</a>
            <a href="#restaurants" className="block py-2 text-gray-600 hover:text-black">Restaurants</a>
            <a href="#diners" className="block py-2 text-gray-600 hover:text-black">Diners</a>
            <a href="#pricing" className="block py-2 text-gray-600 hover:text-black">Pricing</a>
            <button 
              onClick={handleGetStarted}
              className="w-full bg-black text-white py-2 rounded-full mt-2 cursor-pointer hover:bg-gray-800 transition-colors"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}