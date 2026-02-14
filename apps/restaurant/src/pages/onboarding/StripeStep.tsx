import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  ChevronRight, 
  ChevronLeft,
  Check,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Clock,
  Shield
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface Props {
  restaurantId: string | null;
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function StripeStep({ restaurantId, data, updateData, onNext, onPrev }: Props) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  const features = [
    {
      icon: DollarSign,
      title: 'Get paid instantly',
      description: 'Funds deposited directly to your bank account',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: Clock,
      title: 'Next-day payouts',
      description: 'Standard 2-day rolling reserve',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: Shield,
      title: 'Secure payments',
      description: 'Handled by Stripe, PCI compliant',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  const handleConnect = async () => {
    setConnecting(true);
    setError('');
    
    try {
      // In production, this would create a Stripe Connect account
      // and redirect to Stripe's onboarding
      
      // Simulate connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnected(true);
      updateData({ 
        stripeConnected: true,
        stripeAccountId: 'acct_mock_123456'
      });
      
    } catch (err) {
      setError('Failed to connect Stripe. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleSkip = () => {
    updateData({ stripeSkipped: true });
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-light mb-2">Get paid with Stripe</h2>
        <p className="text-gray-400">Connect your account to receive payments instantly</p>
      </div>

      {!connected ? (
        <>
          {/* Features Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Card key={i} padding="md" className="text-center">
                  <div className={`w-10 h-10 ${feature.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                    <Icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <h3 className="text-sm font-medium mb-1">{feature.title}</h3>
                  <p className="text-xs text-gray-400">{feature.description}</p>
                </Card>
              );
            })}
          </div>

          {/* Main Connect Card */}
          <Card padding="xl" className="mb-6">
            <div className="text-center mb-6">
              <img 
                src="https://stripe.com/img/v3/home/twitter.png" 
                alt="Stripe"
                className="h-8 mx-auto mb-4 opacity-75"
              />
              <h3 className="text-xl font-light mb-2">Connect with Stripe</h3>
              <p className="text-sm text-gray-400">
                We use Stripe to securely process all payments
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              onClick={handleConnect}
              disabled={connecting}
              size="lg"
              fullWidth
              className="mb-3"
            >
              {connecting ? 'Connecting...' : 'Connect with Stripe'}
            </Button>

            <button
              onClick={handleSkip}
              className="w-full text-sm text-gray-400 hover:text-black py-2"
            >
              Skip for now
            </button>

            {/* Trust Indicators */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                <span>✓ PCI Compliant</span>
                <span>✓ 256-bit Encryption</span>
                <span>✓ 2FA Required</span>
              </div>
            </div>
          </Card>

          {/* Learn More Link */}
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-sm text-gray-400 hover:text-black mb-6"
          >
            Learn more about Stripe
            <ExternalLink className="w-3 h-3" />
          </a>
        </>
      ) : (
        // Success State
        <Card padding="xl" className="mb-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-light mb-2">Stripe Connected!</h3>
          <p className="text-gray-400 mb-6">
            Your account is ready to receive payments
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Account status</span>
              <span className="text-sm text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Payout schedule</span>
              <span className="text-sm">Daily (2-day rolling)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Platform fee</span>
              <span className="text-sm">1% + Stripe fees</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700 flex items-start gap-2">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Your payment information is securely stored with Stripe. We never see your bank details.</span>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onPrev} className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          {connected ? 'Continue to Complete' : 'Skip for now'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}