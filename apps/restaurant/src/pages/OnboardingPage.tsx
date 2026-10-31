import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, 
  Utensils, 
  Table2, 
  QrCode, 
  CreditCard, 
  CheckCircle,
  ArrowLeft,
  ChefHat,
  Sparkles,
  ScrollText,
  User,
  Briefcase,
  Users
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { RestaurantInfoStep } from './onboarding/RestaurantInfoStep';
import { TablesStep } from './onboarding/TablesStep';
import { MenuImportStep } from './onboarding/MenuImportStep';
import { MenuReviewStep } from './onboarding/MenuReviewStep';
import { QRStep } from './onboarding/QRStep';
import { StripeStep } from './onboarding/StripeStep'; // We'll keep the filename but change the display name
import { CompleteStep } from './onboarding/CompleteStep';
import { config } from '../lib/config';

const steps = [
  { 
    id: 'info', 
    title: 'Restaurant Info', 
    icon: Store, 
    component: RestaurantInfoStep,
    description: 'Tell us about your business'
  },
  { 
    id: 'tables', 
    title: 'Table Setup', 
    icon: Table2, 
    component: TablesStep,
    description: 'Add your tables'
  },
  { 
    id: 'menu', 
    title: 'Import Menu', 
    icon: Utensils, 
    component: MenuImportStep,
    description: 'Add your items'
  },
  { 
    id: 'review', 
    title: 'Review Menu', 
    icon: ScrollText, 
    component: MenuReviewStep,
    description: 'Check everything'
  },
  { 
    id: 'qr', 
    title: 'QR Codes', 
    icon: QrCode, 
    component: QRStep,
    description: 'Generate table codes'
  },
  { 
    id: 'bank',
    title: 'Payment account',
    icon: CreditCard, 
    component: StripeStep,
    description: 'Stripe Connect'
  },
  { 
    id: 'complete', 
    title: 'Done!', 
    icon: CheckCircle, 
    component: CompleteStep,
    description: 'You\'re all set'
  },
];

interface OnboardingData {
  restaurantInfo?: any;
  tables?: any;
  menu?: any;
  qrCodes?: any;
  stripeConnected?: boolean;
  fullName?: string;
  email?: string;
  businessType?: string;
  role?: string;
  teamSize?: string;
  [key: string]: any;
}

export function OnboardingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});

  // Load ALL data from URL params and localStorage on mount
  useEffect(() => {
    const id = searchParams.get('restaurantId') || localStorage.getItem('drift-restaurant-id');
    const stepParam = searchParams.get('step');
    const businessName = searchParams.get('businessName');
    const businessType = searchParams.get('businessType');
    const email = searchParams.get('email');
    const fullName = searchParams.get('fullName');
    const role = searchParams.get('role');
    const teamSize = searchParams.get('teamSize');
    const phone = searchParams.get('phone');
    const token = searchParams.get('token');
    
    console.log('📦 Onboarding page loaded with URL params:', { 
      restaurantId: id, 
      businessName, 
      businessType,
      email,
      fullName,
      role,
      teamSize,
      phone: phone ? '✅ Present' : '❌ Missing',
      token: token ? '✅ Present' : '❌ Missing'
    });
    
    // Save token if present
    if (token) {
      console.log('🔑 Saving token to localStorage');
      localStorage.setItem('drift-token', decodeURIComponent(token));
    }
    
    if (!id) {
      console.log('❌ No restaurantId found - showing error');
      return;
    }
    
    setRestaurantId(id);

    // Build comprehensive user profile from URL params
    const urlProfile = {
      restaurantName: businessName ? decodeURIComponent(businessName) : '',
      businessType: businessType ? decodeURIComponent(businessType) : 'restaurant',
      email: email ? decodeURIComponent(email) : '',
      fullName: fullName ? decodeURIComponent(fullName) : '',
      role: role ? decodeURIComponent(role) : '',
      teamSize: teamSize ? decodeURIComponent(teamSize) : '',
      phone: phone ? decodeURIComponent(phone) : '',
    };

    console.log('👤 Profile from URL:', urlProfile);

    // Save profile to localStorage for other steps to use
    localStorage.setItem('drift-user-profile', JSON.stringify(urlProfile));

    // Jump to specific step if step=bank in URL (e.g. from Settings "Complete payment setup")
    const bankStepIndex = steps.findIndex(s => s.id === 'bank');
    if (stepParam === 'bank' && bankStepIndex >= 0) {
      setCurrentStep(bankStepIndex);
      // Load profile so StripeStep can pre-fill email, address, etc.
      const storedProfile = localStorage.getItem('drift-user-profile');
      const saved = localStorage.getItem(`onboarding-${id}`);
      let dataToUse = { ...urlProfile };
      if (storedProfile) {
        try {
          const p = JSON.parse(storedProfile);
          dataToUse = { ...dataToUse, ...p, restaurantName: p.businessName || p.restaurantName || dataToUse.restaurantName };
        } catch (_) {}
      }
      if (saved) {
        try {
          const { data } = JSON.parse(saved);
          dataToUse = { ...dataToUse, ...data };
        } catch (_) {}
      }
      setOnboardingData(prev => ({ ...prev, ...dataToUse }));
      console.log('📌 Starting at bank step from URL');

      // Also fetch latest restaurant details so payout address/phone can prefill
      const token = localStorage.getItem('drift-token');
      fetch(`${config.apiUrl}/api/restaurants/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((restaurant) => {
          if (!restaurant) return;
          setOnboardingData(prev => ({
            ...prev,
            name: restaurant.name || prev.name,
            restaurantName: restaurant.name || prev.restaurantName,
            phone: restaurant.phone || prev.phone,
            // address can be a string; later steps normalize it
            address: restaurant.address || prev.address,
          }));
        })
        .catch(() => {});
    }

    // Load any saved onboarding progress (unless step=bank overrides)
    const saved = localStorage.getItem(`onboarding-${id}`);
    if (saved && stepParam !== 'bank') {
      try {
        const { step, data } = JSON.parse(saved);
        setCurrentStep(step);
        setOnboardingData(prev => ({
          ...prev,
          ...data,
          // URL data takes precedence over saved data
          ...urlProfile
        }));
        console.log('📂 Loaded saved progress:', { step, data });
      } catch (e) {
        console.error('Error loading saved progress:', e);
        // If no saved progress, just use URL data
        setOnboardingData(prev => ({
          ...prev,
          ...urlProfile
        }));
      }
    } else if (stepParam !== 'bank') {
      // No saved progress, just use URL data
      setOnboardingData(prev => ({
        ...prev,
        ...urlProfile
      }));
    }

    // Also check for drift-user-profile in localStorage (from previous sessions)
    const storedProfile = localStorage.getItem('drift-user-profile');
    if (storedProfile && !saved) {
      try {
        const profile = JSON.parse(storedProfile);
        setOnboardingData(prev => ({
          ...prev,
          ...profile,
          restaurantName: profile.businessName || profile.restaurantName || prev.restaurantName,
        }));
        console.log('📁 Loaded profile from localStorage:', profile);
      } catch (e) {
        console.error('Error loading profile:', e);
      }
    }
  }, [searchParams]);

  // Save progress whenever it changes
  useEffect(() => {
    if (restaurantId) {
      localStorage.setItem(`onboarding-${restaurantId}`, JSON.stringify({
        step: currentStep,
        data: onboardingData
      }));
      
      // Also update the user profile in localStorage
      const profileToSave = {
        restaurantName: onboardingData.restaurantName || onboardingData.name,
        businessType: onboardingData.businessType,
        email: onboardingData.email,
        fullName: onboardingData.fullName,
        role: onboardingData.role,
        teamSize: onboardingData.teamSize,
        phone: onboardingData.phone,
        address: onboardingData.address,
      };
      
      localStorage.setItem('drift-user-profile', JSON.stringify(profileToSave));
    }
  }, [currentStep, onboardingData, restaurantId]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const updateOnboardingData = (data: Partial<OnboardingData>) => {
    console.log('💾 Updating onboarding data:', data);
    setOnboardingData(prev => ({ ...prev, ...data }));
  };

  const CurrentStepComponent = steps[currentStep].component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-light mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-4">No restaurant ID provided. Please complete signup first.</p>
          <Button
            onClick={() => { window.location.href = `${config.landingUrl}/signup`; }}
          >
            Back to Signup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
        <motion.div
          className="h-full bg-black"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-light">drift</h1>
              <p className="text-xs text-gray-400">restaurant setup</p>
            </div>
          </div>
          
          {/* User Profile Summary - Show if we have data */}
          {(onboardingData.fullName || onboardingData.businessType) && (
            <div className="flex items-center gap-3 text-sm">
              {onboardingData.fullName && (
                <span className="text-gray-600 hidden md:inline">
                  {onboardingData.fullName}
                </span>
              )}
              {onboardingData.businessType && (
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                  {onboardingData.businessType}
                </span>
              )}
            </div>
          )}

          {/* Step counter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
        </div>
      </header>

      {/* User Profile Bar - Visible when we have profile data */}
      {(onboardingData.fullName || onboardingData.email || onboardingData.role || onboardingData.teamSize) && (
        <div className="bg-blue-50 border-b border-blue-100">
          <div className="max-w-6xl mx-auto px-6 py-2">
            <div className="flex items-center gap-4 text-xs text-blue-700 flex-wrap">
              {onboardingData.fullName && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {onboardingData.fullName}
                </span>
              )}
              {onboardingData.email && (
                <span className="flex items-center gap-1">
                  <Store className="w-3 h-3" /> {onboardingData.email}
                </span>
              )}
              {onboardingData.role && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> {onboardingData.role}
                </span>
              )}
              {onboardingData.teamSize && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {onboardingData.teamSize}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step Navigation with long connector lines: business → … → bank → verify */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center w-full min-w-0 overflow-x-auto pb-1">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;
              const isLast = index === steps.length - 1;
              return (
                <div key={step.id} className="contents">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex flex-col items-center text-center shrink-0 min-w-[72px]"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-all ${
                        isActive
                          ? 'bg-black text-white shadow-lg scale-110'
                          : isComplete
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isActive ? 'text-black' : isComplete ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </span>
                    <span className="text-[10px] text-gray-300 hidden lg:block mt-0.5">
                      {step.description}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeStep"
                        className="w-full h-0.5 bg-black mt-2 rounded-full"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.div>
                  {/* Connector line between steps - longer for clearer flow */}
                  {!isLast && (
                    <div
                      className="flex-1 min-w-[36px] mx-2 lg:mx-4 flex items-center self-start pt-5"
                      aria-hidden
                    >
                      <div
                        className={`h-0.5 w-full rounded-full transition-colors ${
                          isComplete ? 'bg-green-400' : 'bg-gray-200'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center md:hidden">
            <p className="text-sm text-gray-500">{steps[currentStep].description}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <CurrentStepComponent
            restaurantId={restaurantId}
            data={onboardingData}
            updateData={updateOnboardingData}
            onNext={nextStep}
            onPrev={prevStep}
            onComplete={nextStep}  // Add this line
          />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-3 px-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center text-sm text-gray-400">
          <span>✨ Your progress is automatically saved</span>
          <span>drift</span>
        </div>
      </div>
    </div>
  );
}