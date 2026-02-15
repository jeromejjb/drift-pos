import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Store, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    restaurantName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('📝 Starting signup process...');
      
      // DEVELOPMENT BYPASS - Use this when Supabase isn't configured
      if (!supabase) {
        console.log('🔧 Using development bypass (no Supabase)');
        
        // Create restaurant directly in your API
        const response = await fetch('http://localhost:3001/api/restaurants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.restaurantName,
            email: formData.email,
            supabaseUserId: `dev-${Date.now()}-${Math.random().toString(36).substring(7)}`
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create restaurant');
        }
        
        console.log('✅ Restaurant created (dev mode):', data);
        
        // Store session info
        localStorage.setItem('drift-restaurant-id', data.id);
        localStorage.setItem('drift-user-email', formData.email);
        localStorage.setItem('drift-dev-mode', 'true');
        
        // Redirect to onboarding
        window.location.href = `http://localhost:5174/onboarding?restaurantId=${data.id}`;
        return;
      }
      
      // PRODUCTION FLOW - Real Supabase authentication
      console.log('🔐 Using Supabase authentication');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            restaurant_name: formData.restaurantName,
            user_type: 'restaurant_owner'
          }
        }
      });
      
      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error('No user returned from signup');
      }
      
      console.log('✅ Auth successful:', authData.user.id);
      
      // Create restaurant in your API
      const response = await fetch('http://localhost:3001/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.restaurantName,
          email: formData.email,
          supabaseUserId: authData.user.id
        })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create restaurant');
      }
      
      console.log('✅ Restaurant created:', responseData);
      
      // Store session info
      localStorage.setItem('drift-restaurant-id', responseData.id);
      localStorage.setItem('drift-user-email', formData.email);
      
      // Redirect to onboarding
      window.location.href = `http://localhost:5174/onboarding?restaurantId=${responseData.id}`;
      
    } catch (error) {
      console.error('❌ Signup failed:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else if (typeof error === 'string') {
        setError(error);
      } else {
        setError('An error occurred during signup');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen drift-container overflow-hidden bg-gradient-to-b from-white to-gray-50">
      {/* Drift background layers */}
      <div className="drift-layer-1 opacity-20"></div>
      <div className="drift-layer-2 opacity-10"></div>
      <div className="drift-layer-3 opacity-5"></div>
      
      <div className="container max-w-md mx-auto px-4 py-12 relative z-10">
        {/* Back to home with drift effect */}
        <button 
          onClick={() => navigate('/')}
          className="group text-sm text-gray-400 hover:text-black mb-8 flex items-center gap-1 transition-all duration-300 hover:translate-x-[-4px]"
        >
          <span className="transform group-hover:animate-drift-shear">←</span> Back to home
        </button>

        {/* Header with drift effects */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <Sparkles className="w-8 h-8 text-black mx-auto mb-4 animate-drift-rotate" />
            <div className="absolute inset-0 animate-drift-pulse opacity-50"></div>
          </div>
          <h1 className="text-3xl font-light mb-2 drift-text">Create your account</h1>
          <p className="text-gray-400 animate-drift-float">Get your restaurant set up in minutes</p>
        </div>

        {/* Signup Form with drift card */}
        <Card padding="lg" className="drift-card transform transition-all duration-500 hover:scale-[1.02]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-drift-glitch">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              label="Restaurant Name"
              value={formData.restaurantName}
              onChange={(e) => setFormData({...formData, restaurantName: e.target.value})}
              placeholder="Trattoria Bellini"
              icon={<Store className="w-4 h-4" />}
              required
              className="focus:animate-drift-pulse"
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="hello@trattoria.com"
              icon={<Mail className="w-4 h-4" />}
              required
              className="focus:animate-drift-pulse"
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                  <span className="animate-drift-float">⏳</span> Creating account...
                </span>
              ) : (
                <>
                  <span className="relative z-10 flex items-center gap-2">
                    Continue to Setup
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-black to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/login')}
              className="text-black underline hover:no-underline group relative"
            >
              <span className="relative">
                Sign in
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </span>
            </button>
          </p>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-8 animate-drift-float">
          By signing up, you agree to our Terms and Privacy Policy
        </p>

        {/* Development mode indicator with drift */}
        {!supabase && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg drift-border-animated">
            <p className="text-xs text-yellow-700 text-center animate-drift-pulse">
              ⚡ Running in development mode with mock authentication
            </p>
          </div>
        )}

        {/* Decorative drift particles */}
        <div className="drift-particles">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="drift-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                background: `linear-gradient(135deg, #4158D0, #C850C0)`,
                opacity: 0.1
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}