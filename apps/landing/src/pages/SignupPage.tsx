import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, ArrowRight, Shield } from 'lucide-react';

export function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    businessName: '', // Changed from restaurantName to be more generic
    email: '',
    password: '',
    agreeTerms: false
  });

  // Use environment variable for API URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Call the auth/register endpoint instead of restaurants directly
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.businessName, // User's name (you might want to add a name field)
          email: formData.email,
          password: formData.password,
          restaurantName: formData.businessName // Business name for the restaurant
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Save auth info
      localStorage.setItem('drift-token', data.token);
      localStorage.setItem('drift-restaurant-id', data.restaurantId);
      localStorage.setItem('drift-user-email', formData.email);

      // Get the restaurant app URL from env or default
      const RESTAURANT_URL = import.meta.env.VITE_RESTAURANT_URL || 'http://localhost:5174';
      
      // Direct to onboarding with restaurant ID
      window.location.href = `${RESTAURANT_URL}/onboarding?restaurantId=${data.restaurantId}`;
      
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
      setLoading(false);
    }
  };

  console.log('🔧 SignupPage loaded');
console.log('VITE_RESTAURANT_URL:', import.meta.env.VITE_RESTAURANT_URL);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel - Professional features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden p-16 text-white flex-col justify-between">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMjBoMjB2MjBIMjB6TTAgMGgyMHYyMEgweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjwvc3ZnPg==')] opacity-10"></div>
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-12">
            <Building2 className="w-8 h-8" />
            <span className="text-2xl font-light tracking-tight">drift</span>
          </div>
          
          <h2 className="text-4xl font-light mb-6">Start accepting payments in minutes</h2>
          <p className="text-white/70 text-lg mb-12">Everything you need to manage your business finances in one place.</p>
          
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl">✓</div>
              <div>
                <div className="font-light mb-1">No setup fees</div>
                <div className="text-white/60 text-sm">Pay only when you process payments</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl">⚡</div>
              <div>
                <div className="font-light mb-1">Instant onboarding</div>
                <div className="text-white/60 text-sm">Get started in under 10 minutes</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl">🔒</div>
              <div>
                <div className="font-light mb-1">Enterprise security</div>
                <div className="text-white/60 text-sm">Your data is always protected</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative text-white/60 text-sm">
          <p>Trusted by innovative businesses everywhere</p>
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
            <h2 className="text-3xl font-light text-gray-900 mb-2">Create your account</h2>
            <p className="text-gray-400">Join businesses using Drift to get paid faster</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Trattoria Bellini"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="hello@business.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
                className="mt-1 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-400">
                I agree to the{' '}
                <button type="button" className="text-gray-900 hover:text-gray-700">Terms of Service</button>
                {' '}and{' '}
                <button type="button" className="text-gray-900 hover:text-gray-700">Privacy Policy</button>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 mt-6"
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

          <p className="text-center text-sm text-gray-400 mt-8">
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/login')}
              className="text-gray-900 font-medium hover:text-gray-700 transition-colors"
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