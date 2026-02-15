import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Mock login - replace with real auth
    setTimeout(() => {
      // Redirect to restaurant app with restaurant ID
      window.location.href = 'http://localhost:5174/dashboard/cmllhyep80000zdv6qjotx0rv';
    }, 1000);
  };

  return (
    <div className="min-h-screen drift-container overflow-hidden bg-gradient-to-b from-white to-gray-50">
      {/* Drift background effects */}
      <div className="drift-layer-1 opacity-20"></div>
      <div className="drift-layer-2 opacity-10"></div>
      
      <div className="container max-w-md mx-auto px-4 py-12 relative z-10">
        {/* Back to home with drift effect */}
        <button 
          onClick={() => navigate('/')}
          className="group text-sm text-gray-400 hover:text-black mb-8 flex items-center gap-1 transition-all duration-300 hover:translate-x-[-4px]"
        >
          <span className="transform group-hover:animate-drift-shear">←</span> Back to home
        </button>

        {/* Header with drift text */}
        <div className="text-center mb-8">
          <Sparkles className="w-8 h-8 text-black mx-auto mb-4 animate-drift-pulse" />
          <h1 className="text-3xl font-light mb-2 drift-text">Welcome back</h1>
          <p className="text-gray-400 animate-drift-float">Sign in to your Drift dashboard</p>
        </div>

        {/* Login Form with drift card */}
        <Card padding="lg" className="drift-card transform transition-all duration-500 hover:scale-[1.02]">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="hello@trattoria.com"
              icon={<Mail className="w-4 h-4" />}
              required
              className="focus:animate-drift-pulse"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              required
              className="focus:animate-drift-pulse"
            />

            <Button 
              type="submit" 
              fullWidth 
              size="lg" 
              disabled={loading}
              className="drift-button relative overflow-hidden group"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-drift-float">⏳</span> Signing in...
                </span>
              ) : (
                <>
                  <span className="relative z-10 flex items-center gap-2">
                    Sign in
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-black to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/signup')}
              className="text-black underline hover:no-underline group relative"
            >
              <span className="relative">
                Sign up
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </span>
            </button>
          </p>
        </Card>

        {/* Decorative drift particles */}
        <div className="drift-particles">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="drift-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                background: `linear-gradient(135deg, #667eea, #764ba2)`,
                opacity: 0.1
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}