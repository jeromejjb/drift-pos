import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, User, Users, Briefcase, ArrowRight, Shield } from 'lucide-react';

export function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    businessName: '',
    role: '',
    businessType: 'restaurant', // Default to restaurant but can be changed
    teamSize: '',
    agreeTerms: false
  });

  // Business types for selection
  const businessTypes = [
    { id: 'restaurant', label: 'Restaurant', icon: '🍽️' },
    { id: 'cafe', label: 'Café', icon: '☕' },
    { id: 'bar', label: 'Bar / Pub', icon: '🍺' },
    { id: 'foodtruck', label: 'Food Truck', icon: '🚚' },
    { id: 'bakery', label: 'Bakery', icon: '🥐' },
    { id: 'brewery', label: 'Brewery', icon: '🍺' },
    { id: 'winery', label: 'Winery', icon: '🍷' },
    { id: 'popup', label: 'Pop-up / Event', icon: '🎪' },
    { id: 'other', label: 'Other', icon: '✨' }
  ];

  // Team size options
  const teamSizeOptions = [
    { value: '1', label: 'Just me' },
    { value: '2-5', label: '2-5 people' },
    { value: '6-20', label: '6-20 people' },
    { value: '21-50', label: '21-50 people' },
    { value: '51-200', label: '51-200 people' },
    { value: '201+', label: '201+ people' }
  ];

  // Role options
  const roleOptions = [
    { value: 'owner', label: 'Owner / Founder' },
    { value: 'manager', label: 'Manager' },
    { value: 'chef', label: 'Chef' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'operations', label: 'Operations' },
    { value: 'other', label: 'Other' }
  ];

  // Production URLs
  const API_URL = 'https://drift-api-7vs7.onrender.com';
  const RESTAURANT_URL = 'https://drift-restaurant.onrender.com';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('🚀 Signup started with:', { 
        email: formData.email,
        businessName: formData.businessName,
        businessType: formData.businessType,
        teamSize: formData.teamSize,
        role: formData.role
      });
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          restaurantName: formData.businessName,
          role: formData.role,
          businessType: formData.businessType,
          teamSize: formData.teamSize
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Save comprehensive user info for onboarding
      const userProfile = {
        fullName: formData.fullName,
        email: formData.email,
        businessName: formData.businessName,
        role: formData.role,
        businessType: formData.businessType,
        teamSize: formData.teamSize,
        userId: data.userId,
        restaurantId: data.restaurantId
      };

      localStorage.setItem('drift-token', data.token);
      localStorage.setItem('drift-restaurant-id', data.restaurantId);
      localStorage.setItem('drift-user-profile', JSON.stringify(userProfile));

      // Include ALL data in URL for cross-domain transfer
      const redirectUrl = `${RESTAURANT_URL}/onboarding?` + new URLSearchParams({
        restaurantId: data.restaurantId,
        businessName: formData.businessName,
        businessType: formData.businessType,
        email: formData.email,
        fullName: formData.fullName,
        role: formData.role,
        teamSize: formData.teamSize,
        token: data.token
      }).toString();
      
      console.log('🚀 Redirecting to onboarding with profile data');
      window.location.href = redirectUrl;
      
    } catch (err) {
      console.error('❌ Signup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel - Enhanced features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden p-16 text-white flex-col justify-between">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMjBoMjB2MjBIMjB6TTAgMGgyMHYyMEgweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjwvc3ZnPg==')] opacity-10"></div>
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-12">
            <Building2 className="w-8 h-8" />
            <span className="text-2xl font-light tracking-tight">drift</span>
          </div>
          
          <h2 className="text-4xl font-light mb-6">Welcome to the future of business payments</h2>
          <p className="text-white/70 text-lg mb-12">Join thousands of businesses using Drift to get paid faster and grow smarter.</p>
          
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl">🚀</div>
              <div>
                <div className="font-light mb-1">Go live in minutes</div>
                <div className="text-white/60 text-sm">No contracts, no hidden fees</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl">💳</div>
              <div>
                <div className="font-light mb-1">2.5% per transaction</div>
                <div className="text-white/60 text-sm">Volume discounts available</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl">📊</div>
              <div>
                <div className="font-light mb-1">Real-time analytics</div>
                <div className="text-white/60 text-sm">Know your business better</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative text-white/60 text-sm">
          <p>Trusted by innovative businesses everywhere</p>
        </div>
      </div>

      {/* Right panel - Enhanced signup form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto max-h-screen">
        <div className="w-full max-w-md py-8">
          <button 
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 hover:text-gray-600 mb-8 flex items-center gap-1 transition-colors"
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

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your full name <span className="text-red-500">*</span></label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Alex Johnson"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email address <span className="text-red-500">*</span></label>
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password <span className="text-red-500">*</span></label>
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
              <p className="text-xs text-gray-400 mt-2">Minimum 8 characters</p>
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business name <span className="text-red-500">*</span></label>
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

            {/* Business Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business type</label>
              <div className="grid grid-cols-3 gap-2">
                {businessTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({...formData, businessType: type.id})}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      formData.businessType === type.id
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{type.icon}</span>
                    <span className="text-xs">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your role</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Select your role</option>
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Team Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team size</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.teamSize}
                  onChange={(e) => setFormData({...formData, teamSize: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Select team size</option>
                  {teamSizeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Terms agreement */}
            <div className="flex items-start gap-2 pt-2">
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

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/login')}
              className="text-gray-900 font-medium hover:text-gray-700 transition-colors"
            >
              Sign in
            </button>
          </p>

          {/* Security badges */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-400">
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