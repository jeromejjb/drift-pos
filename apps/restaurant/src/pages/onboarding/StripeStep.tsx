import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  CreditCard, 
  Landmark, 
  Shield, 
  Zap, 
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Clock,
  Percent,
  Sparkles,
  Lock,
  Wallet,
  Crown,
  Star,
  TrendingUp,
  BarChart3,
  Users,
  X
} from 'lucide-react';
import { Button } from './../../components/ui/Button';
import { Card } from './../../components/ui/Card';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Tier configurations
const TIERS = {
  free: {
    name: 'Starter',
    price: '$0',
    period: '/month',
    fee: '3.5%',
    feeValue: 0.035,
    icon: Star,
    gradient: 'from-gray-500 to-gray-600',
    bgLight: 'bg-gray-50',
    border: 'border-gray-200',
    features: [
      'QR code ordering',
      'Up to 5 tables',
      'Basic dashboard',
      'Email support',
      'Standard payouts (2-3 days)'
    ],
    limits: {
      tables: 5,
      menuItems: 50,
      orders: 'unlimited'
    }
  },
  pro: {
    name: 'Pro',
    price: '$49',
    period: '/month',
    fee: '2.5%',
    feeValue: 0.025,
    icon: Crown,
    gradient: 'from-purple-500 to-indigo-600',
    bgLight: 'bg-purple-50',
    border: 'border-purple-200',
    features: [
      'Everything in Starter',
      'Advanced analytics',
      'Customer insights',
      'Priority phone support',
      'Marketing tools',
      'Next-day payouts',
      'No Drift branding'
    ],
    limits: {
      tables: 'unlimited',
      menuItems: 'unlimited',
      orders: 'unlimited'
    }
  }
};

export function StripeStep({ data, onComplete, updateData }) {
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(false);
  
  // Load ALL saved data from props and localStorage
  const [savedData, setSavedData] = useState({
    restaurantName: '',
    email: '',
    tier: 'free',
    tables: 5,
    menuItems: 0,
    monthlyOrders: 0
  });

  // Comprehensive data loading on mount
  useEffect(() => {
    console.log('📊 StripeStep received data prop:', data);
    
    // Start with empty object
    let mergedData: any = {};
    
    // 1. Load from localStorage first
    const stored = localStorage.getItem('drift_onboarding');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('💾 Loaded from localStorage:', parsed);
        mergedData = { ...mergedData, ...parsed };
      } catch (e) {
        console.error('Error parsing localStorage:', e);
      }
    }
    
    // 2. Props override localStorage (they're more recent)
    if (data) {
      console.log('📦 Merging props data:', data);
      mergedData = { ...mergedData, ...data };
    }
    
    // 3. Set the final merged data
    setSavedData({
      restaurantName: mergedData.name || mergedData.restaurantName || 'Your Restaurant',
      email: mergedData.email || '',
      tier: mergedData.tier || 'free',
      tables: Number(mergedData.tables) || 5,
      menuItems: Number(mergedData.menuItems) || 0,
      monthlyOrders: Number(mergedData.monthlyOrders) || 0
    });
    
    if (mergedData.tier) {
      setSelectedTier(mergedData.tier);
    }
    
    console.log('✅ Final savedData:', {
      restaurantName: mergedData.name || mergedData.restaurantName || 'Your Restaurant',
      email: mergedData.email || '',
      tier: mergedData.tier || 'free'
    });
    
  }, [data]);

  // Smart tier recommendation based on usage
  const getRecommendedTier = () => {
    if (savedData.tables > 5 || savedData.menuItems > 50 || savedData.monthlyOrders > 100) {
      return 'pro';
    }
    return 'free';
  };

  const recommendedTier = getRecommendedTier();

  // Calculate annual savings
  const calculateSavings = () => {
    if (annualBilling) {
      return (49 * 12 * 0.2).toFixed(0);
    }
    return 0;
  };

  // Calculate estimated monthly fees
  const calculateEstimatedFees = (avgOrderValue = 45, ordersPerMonth = 100) => {
    const monthlyVolume = avgOrderValue * ordersPerMonth;
    const freeFees = monthlyVolume * 0.035;
    const proFees = (monthlyVolume * 0.025) + 49;
    const savings = freeFees - proFees;
    
    return {
      free: Math.round(freeFees).toString(),
      pro: Math.round(proFees).toString(),
      savings: savings > 0 ? Math.round(savings).toString() : '0'
    };
  };

  const estimated = calculateEstimatedFees(45, savedData.monthlyOrders || 100);

  const handleConnect = async () => {
    setLoading(true);
    
    try {
      // Validate we have required data
      if (!savedData.email) {
        console.error('❌ Missing email. Current state:', savedData);
        throw new Error('Email address is missing. Please go back to Restaurant Info step.');
      }
      
      if (!savedData.restaurantName) {
        throw new Error('Restaurant name is missing. Please go back to Restaurant Info step.');
      }
      
      let API_URL = import.meta.env.VITE_API_URL;
      if (!API_URL) throw new Error('API_URL not configured');
      API_URL = API_URL.replace('http://', 'https://');
      
      console.log('📧 Sending to Stripe API:', {
        email: savedData.email,
        name: savedData.restaurantName,
        restaurantId: data?.restaurantId,
        tier: selectedTier
      });
      
      // Save the selected tier
      if (updateData) {
        await updateData({ tier: selectedTier });
      }
      
      const res = await fetch(`${API_URL}/api/stripe/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: savedData.email,
          name: savedData.restaurantName,
          restaurantId: data?.restaurantId,
          tier: selectedTier
        })
      });
      
      const response = await res.json();
      if (!res.ok) throw new Error(response.error || 'Failed to connect');
      
      const { accountId } = response;
      
      // Save progress
      const onboardingData = {
        ...savedData,
        tier: selectedTier,
        stripeAccountId: accountId,
        stripeConnected: true
      };
      
      localStorage.setItem('drift_onboarding', JSON.stringify(onboardingData));
      if (updateData) {
        await updateData(onboardingData);
      }
      
      alert('✅ Stripe account created successfully!');
      onComplete();
      
    } catch (error) {
      console.error('❌ Connection error:', error);
      alert(`Failed to connect: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Summary Card
  const SummaryCard = () => (
    <motion.div 
      variants={fadeInUp}
      className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 mb-8 border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="font-medium text-gray-700">Your Business Snapshot</h3>
        </div>
        {recommendedTier !== selectedTier && (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
          >
            ⚡ Recommended: Upgrade to Pro
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <Building2 className="w-4 h-4 text-blue-500 mb-1" />
          <p className="text-xs text-gray-500">Restaurant</p>
          <p className="font-medium text-sm truncate">{savedData.restaurantName}</p>
        </div>
        
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <CreditCard className="w-4 h-4 text-green-500 mb-1" />
          <p className="text-xs text-gray-500">Email</p>
          <p className="font-medium text-sm truncate">{savedData.email || 'Not set'}</p>
        </div>
        
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <Percent className="w-4 h-4 text-purple-500 mb-1" />
          <p className="text-xs text-gray-500">Plan</p>
          <p className="font-medium text-sm capitalize">{selectedTier}</p>
        </div>
        
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <Users className="w-4 h-4 text-orange-500 mb-1" />
          <p className="text-xs text-gray-500">Tables</p>
          <p className="font-medium text-sm">{savedData.tables} tables</p>
        </div>
      </div>
      
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs font-mono">
          <p>Email: {savedData.email || '❌ MISSING'}</p>
          <p>Name: {savedData.restaurantName || '❌ MISSING'}</p>
          <p>Tables: {savedData.tables}</p>
          <p>Menu Items: {savedData.menuItems}</p>
        </div>
      )}
    </motion.div>
  );

  // Tier Card
  const TierCard = ({ tierId, tier }) => {
    const TierIcon = tier.icon;
    const isSelected = selectedTier === tierId;
    const isRecommended = recommendedTier === tierId && tierId === 'pro';
    
    return (
      <motion.div
        whileHover={{ y: -4 }}
        className={`relative rounded-2xl p-6 cursor-pointer transition-all ${
          isSelected 
            ? `ring-2 ring-black shadow-xl bg-white` 
            : `border-2 ${tier.border} hover:border-gray-300 bg-white`
        }`}
        onClick={() => setSelectedTier(tierId)}
      >
        {isRecommended && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs px-3 py-1 rounded-full shadow-lg">
              Best for you ⚡
            </span>
          </div>
        )}
        
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center mb-3`}>
              <TierIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-medium">{tier.name}</h3>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-light">{tier.price}</span>
              <span className="text-gray-400 text-sm">{tier.period}</span>
            </div>
            <div className="mt-1">
              <span className="text-lg font-medium">{tier.fee}</span>
              <span className="text-gray-400 text-xs ml-1">per transaction</span>
            </div>
          </div>
          
          {isSelected && (
            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        
        <div className="space-y-3 mb-6">
          {tier.features.map((feature, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-600">{feature}</span>
            </div>
          ))}
        </div>
        
        {tierId === 'pro' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={annualBilling}
                onChange={(e) => setAnnualBilling(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Pay annually <span className="text-purple-600 font-medium">(save ${calculateSavings()}/year)</span></span>
            </label>
          </div>
        )}
      </motion.div>
    );
  };

  // Upgrade Modal
  const UpgradeModal = () => (
    <AnimatePresence>
      {showUpgradeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowUpgradeModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-2xl font-light mb-2">Go Pro & Save More</h3>
            <p className="text-gray-500 mb-6">
              Based on your business size, you could save money with Pro.
            </p>
            
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Starter (3.5%)</span>
                <span className="font-medium">${estimated.free}/mo</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Pro (2.5% + $49)</span>
                <span className="font-medium text-purple-700">${estimated.pro}/mo</span>
              </div>
              {Number(estimated.savings) > 0 && (
                <div className="bg-green-100 text-green-700 text-sm p-2 rounded-lg text-center">
                  Save ${estimated.savings}/month with Pro! 🎉
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1"
              >
                Keep Starter
              </Button>
              <Button
                onClick={() => {
                  setSelectedTier('pro');
                  setShowUpgradeModal(false);
                }}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600"
              >
                Upgrade to Pro
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Main render
  return (
    <>
      <motion.div 
        initial="initial"
        animate="animate"
        exit="exit"
        variants={stagger}
        className="max-w-6xl mx-auto p-6"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-black to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Landmark className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-light mb-2 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
            Choose Your Plan
          </h2>
          <p className="text-gray-500 text-lg">
            Step 6 of 7 • Select how you want to grow
          </p>
          
          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-100 rounded-full mt-4 max-w-md mx-auto">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '75%' }}
              className="h-full bg-gradient-to-r from-black to-gray-600 rounded-full"
            />
          </div>
        </motion.div>

        {/* Summary from previous steps */}
        <SummaryCard />

        {/* Tier Selection Grid */}
        <motion.div 
          variants={fadeInUp}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <TierCard tierId="free" tier={TIERS.free} />
          <TierCard tierId="pro" tier={TIERS.pro} />
        </motion.div>

        {/* Fee Comparison */}
        <motion.div variants={fadeInUp} className="mb-8">
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-0">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm">
                  <span className="font-medium">Smart pricing:</span> The more you grow, the less you pay. 
                  {selectedTier === 'free' && ' Upgrade to Pro to save 1% on every transaction!'}
                  {selectedTier === 'pro' && ' You\'re saving 1% compared to Starter!'}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Action Button */}
        <motion.div variants={fadeInUp} className="text-center">
          <Button
            size="lg"
            onClick={handleConnect}
            disabled={loading || !savedData.email}
            className="px-12 relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Continue with {TIERS[selectedTier].name}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
          </Button>
          
          <p className="text-xs text-gray-400 mt-3">
            No credit card required for Starter. Cancel anytime.
          </p>
        </motion.div>
      </motion.div>

      {/* Upgrade Modal */}
      <UpgradeModal />
    </>
  );
}