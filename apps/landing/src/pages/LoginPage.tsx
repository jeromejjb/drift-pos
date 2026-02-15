import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, TrendingUp } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Call your API to authenticate
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Save auth token and restaurant ID
        localStorage.setItem('drift-token', data.token);
        localStorage.setItem('drift-restaurant-id', data.restaurantId);
        
        // Direct to restaurant dashboard (not login page!)
        window.location.href = `http://localhost:5174/dashboard/${data.restaurantId}`;
      } else {
        alert(data.error || 'Login failed');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel - Professional branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6TTAgMGgzMHYzMEgweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjwvc3ZnPg==')] opacity-10"></div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-8 h-8" />
              <span className="text-2xl font-light tracking-tight">drift</span>
            </div>
            <h1 className="text-4xl font-light mb-4">Financial intelligence for modern businesses</h1>
            <p className="text-white/70 text-lg mb-8">Join thousands of businesses using Drift to manage payments, analytics, and growth.</p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl font-light">1M+</div>
              <div>
                <div className="font-light">Transactions processed</div>
                <div className="text-white/60 text-sm">Securely every month</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl font-light">99.9%</div>
              <div>
                <div className="font-light">Platform uptime</div>
                <div className="text-white/60 text-sm">Enterprise-grade reliability</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl font-light">24/7</div>
              <div>
                <div className="font-light">Expert support</div>
                <div className="text-white/60 text-sm">When you need it most</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back link */}
          <button 
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 hover:text-gray-600 mb-12 flex items-center gap-1 transition-colors"
          >
            ← Back to home
          </button>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-light text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-400">Sign in to access your dashboard</p>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="name@company.com"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
              className="w-full bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign in to dashboard
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-400 mt-8">
            New to Drift?{' '}
            <button 
              onClick={() => navigate('/signup')}
              className="text-gray-900 font-medium hover:text-gray-700 transition-colors"
            >
              Create an account
            </button>
          </p>

          {/* Security badge */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              🔒 Bank-level security · SOC 2 Type II certified
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}