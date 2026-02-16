import { Link } from 'react-router-dom';
import { Building2, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5" />
              <h3 className="text-xl font-light">drift</h3>
            </Link>
            <p className="text-sm text-gray-400">Payments for business. Finally done right.</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-black transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-black transition-colors">Pricing</a></li>
              <li><Link to="/faq" className="hover:text-black transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/about" className="hover:text-black transition-colors">About</Link></li>
              <li><Link to="/blog" className="hover:text-black transition-colors">Blog</Link></li>
              <li><Link to="/careers" className="hover:text-black transition-colors">Careers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/privacy" className="hover:text-black transition-colors">Privacy</Link></li>
              <li><Link to="/terms" className="hover:text-black transition-colors">Terms</Link></li>
              <li><Link to="/security" className="hover:text-black transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              © 2026 Drift Technologies. All rights reserved.
            </p>
            
          
          <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Built with</span>
              <span className="text-gray-400">♡</span>
              <span className="text-sm text-gray-400">on the</span>
              <img 
                src="/greatlakes.png" 
                alt="Great Lakes" 
                className="h-8 w-auto inline-block opacity-80 hover:opacity-100 transition-opacity"
              />
              </div>
          </div>
        </div>
      </div>
    </footer>
  );
}