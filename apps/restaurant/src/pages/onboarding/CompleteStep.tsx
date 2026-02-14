import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Sparkles, 
  ArrowRight,
  Download,
  Coffee,
  Users,
  TrendingUp,
  Mail
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

export function CompleteStep({ restaurantId, data }: Props) {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Clear onboarding progress from localStorage
    if (restaurantId) {
      localStorage.removeItem(`onboarding-${restaurantId}`);
    }
    
    // Show confetti for 3 seconds
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, [restaurantId]);

  const stats = [
    {
      icon: Coffee,
      label: 'Menu Items',
      value: data?.menu?.categories?.reduce((acc: number, cat: any) => acc + cat.items.length, 0) || 12,
    },
    {
      icon: Users,
      label: 'Tables',
      value: data?.tables?.length || 10,
    },
    {
      icon: TrendingUp,
      label: 'Ready to serve',
      value: 'Now!',
    },
  ];

  const nextSteps = [
    'Print and place QR codes on tables',
    'Train staff on the dashboard',
    'Share with your first customers',
    'Monitor orders in real-time',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto text-center"
    >
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-black rounded-full"
              initial={{
                top: '50%',
                left: '50%',
                scale: 0,
              }}
              animate={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                scale: Math.random() * 2,
                opacity: 0,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="w-24 h-24 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle className="w-12 h-12 text-green-600" />
      </motion.div>

      {/* Congratulations */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-4xl font-light mb-3"
      >
        You're all set,{data?.restaurantInfo?.name ? ` ${data.restaurantInfo.name.split(' ')[0]}` : ''}!
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-gray-400 text-lg mb-8"
      >
        Your restaurant is ready to start taking orders with Drift
      </motion.p>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-3 gap-4 mb-8"
      >
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} padding="md" className="text-center">
              <Icon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <div className="text-2xl font-light mb-1">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </Card>
          );
        })}
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-8"
      >
        <Card padding="lg" className="text-left">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Next steps
          </h3>
          <div className="space-y-3">
            {nextSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                  {i + 1}
                </div>
                <span className="text-gray-600">{step}</span>
              </div>
            ))}
          </div>

          {/* QR Code Download Reminder */}
          {data?.qrGenerated && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 flex items-start gap-2">
                <Download className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Don't forget to download your QR codes from the previous step!
                </span>
              </p>
            </div>
          )}

          {/* Stripe Reminder */}
          {!data?.stripeConnected && !data?.stripeSkipped && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-700 flex items-start gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  You skipped Stripe setup. You can connect payments anytime from Settings.
                </span>
              </p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="space-y-3"
      >
        <Button
          onClick={() => navigate(`/dashboard/${restaurantId}`)}
          size="lg"
          fullWidth
          className="shadow-lg"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <Button
          variant="secondary"
          onClick={() => window.open('mailto:support@drift.com', '_blank')}
          fullWidth
        >
          <Mail className="w-4 h-4 mr-2" />
          Need help? Contact us
        </Button>
      </motion.div>

      {/* Success Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-xs text-gray-400 mt-8"
      >
        We've sent a confirmation email with these details
      </motion.p>
    </motion.div>
  );
}