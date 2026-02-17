import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Building2, ChevronRight, Heart, Shield } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Use environment variable for API URL
  const API_URL = import.meta.env.VITE_API_URL || 'https://drift-api-7vs7.onrender.com';
  const RESTAURANT_URL = import.meta.env.VITE_RESTAURANT_URL || 'https://drift-restaurant.onrender.com';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('🔐 Login attempt:', { email });
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Save auth token and restaurant ID
        localStorage.setItem('drift-token', data.token);
        localStorage.setItem('drift-restaurant-id', data.restaurantId);
        
        console.log('✅ Login successful, redirecting to dashboard');
        
        // Direct to restaurant dashboard with restaurant ID
        window.location.href = `${RESTAURANT_URL}/dashboard/${data.restaurantId}`;
      } else {
        alert(data.error || 'Login failed');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      alert('Connection error. Please check your internet connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
      {/* Left panel - DRIFT Branded (matching signup page) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden p-12 text-white flex-col">
        {/* Great Lakes pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-16"
          >
            <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xl font-light tracking-tight">drift</span>
          </motion.div>
          
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-12"
          >
            <h1 className="text-5xl font-light leading-tight mb-4">
              Welcome back to
              <br />
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                your dashboard
              </span>
            </h1>
            <p className="text-white/60 text-lg">
              Access your analytics, manage payments, and grow your business.
            </p>
          </motion.div>
          
         {/* Welcome back to... */}
        <div className="space-y-4 mb-12">
          {[
            { feature: 'Your business overview', detail: 'Sales, trends, and insights' },
            { feature: 'Order management', detail: 'Live orders and history' },
            { feature: 'Menu control', detail: 'Update anytime, anywhere' }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="w-1 h-8 bg-white/20 rounded-full" />
              <div>
                <div className="text-2xl font-light text-white">{item.feature}</div>
                <div className="text-white/40 text-sm">{item.detail}</div>
              </div>
            </motion.div>
          ))}
        </div>
          
          {/* Great Lakes pride - matching signup page */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-auto"
          >
            <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
              <span>Built with</span>
              <Heart className="w-4 h-4 text-white/40" />
              <span>on the</span>
              <img 
                src="/greatlakes.png" 
                alt="Great Lakes" 
                className="h-5 w-auto inline-block opacity-40 hover:opacity-60 transition-opacity"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <div className="flex gap-6 text-white/20 text-xs mt-2 justify-center">
              <span>SOC 2 Type II</span>
              <span>PCI DSS Level 1</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Back link */}
          <button 
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 hover:text-gray-600 mb-12 flex items-center gap-1 transition-colors group"
          >
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </button>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-light text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-400">Sign in to access your dashboard</p>
          </div>

          {/* Login form - with signup page styling */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
              <div className={`relative transition-all ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                  focusedField === 'email' ? 'text-black' : 'text-gray-400'
                }`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none transition-all bg-white"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className={`relative transition-all ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                  focusedField === 'password' ? 'text-black' : 'text-gray-400'
                }`} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none transition-all bg-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                <span className="text-sm text-gray-400">Remember me</span>
              </label>
              <button type="button" className="text-sm text-gray-900 hover:text-gray-700 font-medium">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 group"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign in to dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-400 mt-8">
            New to Drift?{' '}
            <button 
              onClick={() => navigate('/signup')}
              className="text-gray-900 font-medium hover:text-gray-700 transition-colors underline decoration-gray-200 hover:decoration-gray-400"
            >
              Create an account
            </button>
          </p>

          {/* Security badges - matching signup page style */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 pt-8 border-t border-gray-100"
          >
            <div className="flex items-center justify-center gap-4 text-xs text-gray-300">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" /> 256-bit SSL
              </span>
              <span>✓ PCI Compliant</span>
              <span>🔒 SOC 2</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}