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
  ScrollText
} from 'lucide-react';
import { RestaurantInfoStep } from './onboarding/RestaurantInfoStep';
import { TablesStep } from './onboarding/TablesStep';
import { MenuImportStep } from './onboarding/MenuImportStep';
import { MenuReviewStep } from './onboarding/MenuReviewStep';
import { QRStep } from './onboarding/QRStep';
import { StripeStep } from './onboarding/StripeStep';
import { CompleteStep } from './onboarding/CompleteStep';

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
    id: 'stripe', 
    title: 'Payments', 
    icon: CreditCard, 
    component: StripeStep,
    description: 'Connect Stripe'
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
  [key: string]: any;
}

export function OnboardingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});

  useEffect(() => {
    const id = searchParams.get('restaurantId');
    const businessName = searchParams.get('businessName');
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    
    console.log('📦 Onboarding page loaded with:', { 
      restaurantId: id, 
      businessName, 
      email,
      token: token ? '✅ Present' : '❌ Missing'
    });
    
    if (token) {
      console.log('🔑 Saving token to localStorage');
      localStorage.setItem('drift-token', decodeURIComponent(token));
    }
    
    if (!id) {
      console.log('❌ No restaurantId found - showing error');
      return;
    }
    
    setRestaurantId(id);

    if (businessName || email) {
      setOnboardingData(prev => ({
        ...prev,
        restaurantInfo: {
          ...prev.restaurantInfo,
          name: businessName ? decodeURIComponent(businessName) : '',
          email: email ? decodeURIComponent(email) : ''
        }
      }));
    }

    const saved = localStorage.getItem(`onboarding-${id}`);
    if (saved) {
      try {
        const { step, data } = JSON.parse(saved);
        setCurrentStep(step);
        setOnboardingData(prev => ({
          ...prev,
          ...data
        }));
        console.log('📂 Loaded saved progress:', { step, data });
      } catch (e) {
        console.error('Error loading saved progress:', e);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (restaurantId) {
      localStorage.setItem(`onboarding-${restaurantId}`, JSON.stringify({
        step: currentStep,
        data: onboardingData
      }));
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
          <p className="text-gray-400 mb-4">No restaurant ID provided. Please go back to signup.</p>
          <button
            onClick={() => window.location.href = 'https://drift-landing.onrender.com/signup'}
            className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800"
          >
            Back to Signup
          </button>
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
          
          {/* Step counter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
        </div>
      </header>

      {/* Beautiful Step Navigation */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-7 gap-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;
              const isFuture = index > currentStep;
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Icon circle */}
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
                    
                    {/* Title */}
                    <span
                      className={`text-xs font-medium mb-0.5 ${
                        isActive
                          ? 'text-black'
                          : isComplete
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </span>
                    
                    {/* Description - hidden on small screens, visible on hover */}
                    <span className="text-[10px] text-gray-300 hidden md:block">
                      {step.description}
                    </span>

                    {/* Active indicator line */}
                    {isActive && (
                      <motion.div
                        layoutId="activeStep"
                        className="absolute -bottom-3 left-0 right-0 h-0.5 bg-black"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Current step description - visible on mobile */}
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