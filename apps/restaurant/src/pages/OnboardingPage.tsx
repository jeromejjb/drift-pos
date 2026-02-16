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
} from 'lucide-react';
import { RestaurantInfoStep } from './onboarding/RestaurantInfoStep';
import { TablesStep } from './onboarding/TablesStep';
import { MenuImportStep } from './onboarding/MenuImportStep';
import { MenuReviewStep } from './onboarding/MenuReviewStep';
import { QRStep } from './onboarding/QRStep';
import { StripeStep } from './onboarding/StripeStep';
import { CompleteStep } from './onboarding/CompleteStep';

const steps = [
  { id: 'info', title: 'Restaurant Info', icon: Store, component: RestaurantInfoStep },
  { id: 'tables', title: 'Table Setup', icon: Table2, component: TablesStep },
  { id: 'menu', title: 'Import Menu', icon: Utensils, component: MenuImportStep },
  { id: 'review', title: 'Review Menu', icon: Utensils, component: MenuReviewStep },
  { id: 'qr', title: 'QR Codes', icon: QrCode, component: QRStep },
  { id: 'stripe', title: 'Payments', icon: CreditCard, component: StripeStep },
  { id: 'complete', title: 'Done!', icon: CheckCircle, component: CompleteStep },
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
    // Get all params from URL
    const id = searchParams.get('restaurantId');
    const businessName = searchParams.get('businessName');
    const email = searchParams.get('email');
    
    console.log('📦 Onboarding page loaded with:', { 
      restaurantId: id, 
      businessName, 
      email,
      fullUrl: window.location.href 
    });
    
    if (!id) {
      console.log('❌ No restaurantId found - showing error');
      return;
    }
    
    setRestaurantId(id);

    // Pre-fill restaurant info with data from signup
    if (businessName || email) {
      console.log('📝 Pre-filling restaurant info from signup:', { businessName, email });
      setOnboardingData(prev => ({
        ...prev,
        restaurantInfo: {
          ...prev.restaurantInfo,
          name: businessName ? decodeURIComponent(businessName) : '',
          email: email ? decodeURIComponent(email) : ''
        }
      }));
    }

    // Load saved progress from localStorage
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
      console.log('💾 Saved progress:', { step: currentStep, data: onboardingData });
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

  // If no restaurantId yet, show error
  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-light mb-2">Missing Restaurant ID</h2>
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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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
          
          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
        </div>
      </header>

      {/* Step Navigation Tabs */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 overflow-x-auto">
          <div className="flex gap-8 min-w-max">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;
              
              return (
                <div
                  key={step.id}
                  className={`py-4 flex items-center gap-2 border-b-2 transition-colors ${
                    isActive 
                      ? 'border-black text-black' 
                      : isComplete
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-300'
                  }`}
                >
                  <StepIcon className="w-4 h-4" />
                  <span className="text-sm font-medium whitespace-nowrap">
                    {step.title}
                  </span>
                  {isComplete && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              );
            })}
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

      {/* Footer with Save Status */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-3 px-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center text-sm text-gray-400">
          <span>✨ Your progress is automatically saved</span>
          <span>drift</span>
        </div>
      </div>
    </div>
  );
}