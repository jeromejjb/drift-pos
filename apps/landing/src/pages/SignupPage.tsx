import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, ArrowRight, Shield } from 'lucide-react';

export function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    restaurantName: '',
    email: '',
    password: '',
    agreeTerms: false
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      window.location.href = 'http://localhost:5174/onboarding';
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel - Professional features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary relative overflow-hidden p-16 text-white flex-col justify-between">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMjBoMjB2MjBIMjB6TTAgMGgyMHYyMEgweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjwvc3ZnPg==')] opacity-10"></div>
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-12">
            <Building2 className="w-8 h-8" />
            <span className="text-2xl font-semibold">Drift</span>
          </div>
          
          <h2 className="text-4xl font-light mb-6">Start accepting payments in minutes</h2>
          <p className="text-white/70 text-lg mb-12">Everything you need to manage your restaurant's finances in one place.</p>
          
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl">✓</div>
              <div>
                <div className="font-semibold mb-1">No setup fees</div>
                <div className="text-white/60 text-sm">Pay only when you process payments</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl">⚡</div>
              <div>
                <div className="font-semibold mb-1">Instant onboarding</div>
                <div className="text-white/60 text-sm">Get started in under 10 minutes</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl">🔒</div>
              <div>
                <div className="font-semibold mb-1">Enterprise security</div>
                <div className="text-white/60 text-sm">Your data is always protected</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative text-white/60 text-sm">
          <p>Trusted by 5,000+ restaurants</p>
        </div>
      </div>

      {/* Right panel - Signup form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <button 
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 hover:text-gray-600 mb-12 flex items-center gap-1 transition-colors"
          >
            ← Back to home
          </button>

          <div className="mb-8">
            <h2 className="text-3xl font-light text-primary mb-2">Create your account</h2>
            <p className="text-secondary">Join thousands of restaurants using Drift</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="fin-input-label">Restaurant name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.restaurantName}
                  onChange={(e) => setFormData({...formData, restaurantName: e.target.value})}
                  className="fin-input pl-12"
                  placeholder="Trattoria Bellini"
                  required
                />
              </div>
            </div>

            <div>
              <label className="fin-input-label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="fin-input pl-12"
                  placeholder="hello@trattoria.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="fin-input-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="fin-input pl-12"
                  placeholder="Create a strong password"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">Minimum 8 characters with 1 number and 1 special character</p>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={formData.agreeTerms}
                onChange={(e) => setFormData({...formData, agreeTerms: e.target.checked})}
                className="mt-1 rounded border-gray-300 text-accent focus:ring-accent"
                required
              />
              <label htmlFor="terms" className="text-sm text-secondary">
                I agree to the{' '}
                <button type="button" className="text-primary hover:text-accent">Terms of Service</button>
                {' '}and{' '}
                <button type="button" className="text-primary hover:text-accent">Privacy Policy</button>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="fin-btn-primary w-full mt-6"
            >
              {loading ? (
                <span>Creating account...</span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-secondary mt-8">
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/login')}
              className="text-primary font-medium hover:text-accent transition-colors"
            >
              Sign in
            </button>
          </p>

          {/* Security badges */}
          <div className="mt-12 flex items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" /> SOC 2
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" /> PCI DSS
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" /> GDPR
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}