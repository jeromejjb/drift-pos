// apps/landing/src/pages/SignupPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Store, ArrowRight, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container max-w-md mx-auto px-4 py-12">
        <button 
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-black mb-8 flex items-center gap-1"
        >
          ← Back to home
        </button>

        <div className="text-center mb-8">
          <Sparkles className="w-8 h-8 text-black mx-auto mb-4" />
          <h1 className="text-3xl font-light mb-2">Create your account</h1>
          <p className="text-gray-400">Get your restaurant set up in minutes</p>
        </div>

        <Card padding="lg">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
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
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="hello@trattoria.com"
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? 'Creating account...' : 'Continue to Setup →'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/login')}
              className="text-black underline"
            >
              Sign in
            </button>
          </p>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-8">
          By signing up, you agree to our Terms and Privacy Policy
        </p>

        {/* Development mode indicator */}
        {!supabase && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-700 text-center">
              ⚡ Running in development mode with mock authentication
            </p>
          </div>
        )}
      </div>
    </div>
  );
}