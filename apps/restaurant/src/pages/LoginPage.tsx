import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://drift-api-7vs7.onrender.com';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('drift-token', data.token);
        localStorage.setItem('drift-restaurant-id', data.restaurantId);
        navigate(`/dashboard/${data.restaurantId}`);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Decorative header */}
      <div className="h-48 bg-gradient-to-br from-black to-gray-800 -mb-24">
        <div className="container mx-auto px-4 pt-12">
          <Sparkles className="w-8 h-8 text-white/50" />
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4">
        {/* Logo Card */}
        <Card padding="lg" className="text-center mb-6">
          <h1 className="text-4xl font-light tracking-tight mb-2">drift</h1>
          <p className="text-gray-400">restaurant partner</p>
          <div className="flex justify-center gap-1 mt-4">
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          </div>
        </Card>

        {/* Login Form */}
        <Card padding="lg">
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@trattoria.com"
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={loading}
              icon={loading ? undefined : <ArrowRight className="w-4 h-4" />}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">Demo access</p>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-mono text-center">
                demo@drift.com • password
              </p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          © 2026 Drift Technologies
        </p>
      </div>
    </div>
  );
}