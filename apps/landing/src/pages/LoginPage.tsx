import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container max-w-md mx-auto px-4 py-12">
        {/* Back to home */}
        <button 
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-black mb-8 flex items-center gap-1"
        >
          ← Back to home
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light mb-2">Welcome back</h1>
          <p className="text-gray-400">Sign in to your Drift dashboard</p>
        </div>

        {/* Login Form */}
        <Card padding="lg">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="hello@trattoria.com"
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? 'Signing in...' : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/signup')}
              className="text-black underline"
            >
              Sign up
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}