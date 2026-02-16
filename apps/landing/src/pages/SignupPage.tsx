import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Mail, 
  Lock, 
  User, 
  Users, 
  Briefcase, 
  ArrowRight, 
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  Phone,
  X,
  Loader2,
  Heart,
  Sparkles,
  Shield,
  TrendingUp,
  Zap,
  Clock,
  BarChart3
} from 'lucide-react';

export function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [modalContent, setModalContent] = useState<'terms' | 'privacy'>('terms');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    role: '',
    businessType: '',
    teamSize: '',
    countryCode: '+1',
    phone: '',
    agreeTerms: false
  });

  // Business types with icons
  const businessTypes = [
    { id: 'restaurant', label: 'Restaurant', icon: '🍽️', color: 'bg-orange-50 text-orange-600', gradient: 'from-orange-500 to-red-500' },
    { id: 'cafe', label: 'Café', icon: '☕', color: 'bg-amber-50 text-amber-600', gradient: 'from-amber-500 to-yellow-500' },
    { id: 'bar', label: 'Bar / Pub', icon: '🍺', color: 'bg-yellow-50 text-yellow-600', gradient: 'from-yellow-500 to-amber-500' },
    { id: 'foodtruck', label: 'Food Truck', icon: '🚚', color: 'bg-blue-50 text-blue-600', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'bakery', label: 'Bakery', icon: '🥐', color: 'bg-rose-50 text-rose-600', gradient: 'from-rose-500 to-pink-500' },
    { id: 'brewery', label: 'Brewery', icon: '🍺', color: 'bg-amber-50 text-amber-600', gradient: 'from-amber-500 to-orange-500' },
    { id: 'winery', label: 'Winery', icon: '🍷', color: 'bg-purple-50 text-purple-600', gradient: 'from-purple-500 to-indigo-500' },
    { id: 'popup', label: 'Pop-up', icon: '🎪', color: 'bg-pink-50 text-pink-600', gradient: 'from-pink-500 to-rose-500' },
    { id: 'retail', label: 'Retail', icon: '🏪', color: 'bg-green-50 text-green-600', gradient: 'from-green-500 to-emerald-500' },
    { id: 'services', label: 'Services', icon: '💼', color: 'bg-blue-50 text-blue-600', gradient: 'from-blue-500 to-indigo-500' },
    { id: 'other', label: 'Other', icon: '✨', color: 'bg-gray-50 text-gray-600', gradient: 'from-gray-500 to-gray-600' }
  ];

  const roleOptions = [
    { value: 'owner', label: 'Owner / Founder', icon: '👑' },
    { value: 'manager', label: 'Manager', icon: '📊' },
    { value: 'director', label: 'Director', icon: '🎯' },
    { value: 'chef', label: 'Chef', icon: '👨‍🍳' },
    { value: 'marketing', label: 'Marketing', icon: '📈' },
    { value: 'operations', label: 'Operations', icon: '⚙️' },
    { value: 'sales', label: 'Sales', icon: '🤝' },
    { value: 'other', label: 'Other', icon: '✨' }
  ];

  const teamSizeOptions = [
    { value: '1', label: 'Just me', icon: '👤' },
    { value: '2-5', label: '2-5 people', icon: '👥' },
    { value: '6-20', label: '6-20 people', icon: '👪' },
    { value: '21-50', label: '21-50 people', icon: '🏢' },
    { value: '51-200', label: '51-200 people', icon: '🏛️' },
    { value: '201-500', label: '201-500 people', icon: '🏬' },
    { value: '501+', label: '500+ people', icon: '🌆' }
  ];

  const countryCodes = [
    { code: '+1', country: 'US/CA' },
    { code: '+44', country: 'UK' },
    { code: '+61', country: 'AU' },
    { code: '+91', country: 'IN' },
    { code: '+86', country: 'CN' },
    { code: '+81', country: 'JP' },
    { code: '+49', country: 'DE' },
    { code: '+33', country: 'FR' },
    { code: '+39', country: 'IT' },
    { code: '+34', country: 'ES' },
    { code: '+55', country: 'BR' },
    { code: '+52', country: 'MX' },
  ];

  // Phone number formatting function
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 10);
    
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    } else {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6, 10)}`;
    }
  };

  // Phone validation
  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 0) return true;
    if (numbers.length !== 10) {
      setPhoneError('Phone number must have 10 digits');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
    validatePhone(formatted);
  };

  const handlePhoneBlur = () => {
    if (formData.phone) {
      validatePhone(formData.phone);
    } else {
      setPhoneError(null);
    }
  };

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (password.match(/[a-z]+/)) strength += 15;
    if (password.match(/[A-Z]+/)) strength += 15;
    if (password.match(/[0-9]+/)) strength += 20;
    if (password.match(/[$@#&!%*?]+/)) strength += 20;
    return Math.min(strength, 100);
  };

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Real-time validation effects
  useEffect(() => {
    if (formData.email) {
      setEmailValid(validateEmail(formData.email));
    } else {
      setEmailValid(null);
    }
  }, [formData.email]);

  useEffect(() => {
    if (formData.confirmPassword && formData.password) {
      setPasswordsMatch(formData.password === formData.confirmPassword);
    } else {
      setPasswordsMatch(null);
    }
  }, [formData.password, formData.confirmPassword]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData({ ...formData, password });
    setPasswordStrength(checkPasswordStrength(password));
  };

  const getStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Good';
    return 'Strong';
  };

  const API_URL = 'https://drift-api-7vs7.onrender.com';
  const RESTAURANT_URL = 'https://drift-restaurant.onrender.com';

  // Step validation
  const isStep1Valid = () => {
    return (
      formData.fullName.trim() !== '' &&
      formData.email.trim() !== '' &&
      emailValid === true &&
      formData.password.length >= 8 &&
      passwordsMatch === true
    );
  };

  const isStep2Valid = () => {
    return (
      formData.businessName.trim() !== '' &&
      formData.businessType !== '' &&
      formData.role !== '' &&
      formData.teamSize !== '' &&
      !phoneError
    );
  };

  const handleNextStep = () => {
    if (step === 1 && isStep1Valid()) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
    window.scrollTo(0, 0);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep2Valid() || !formData.agreeTerms) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Store formatted phone for display
      const phoneToStore = formData.phone || '';
      // Send digits to API
      const phoneDigits = formData.phone ? formData.phone.replace(/\D/g, '') : '';
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          restaurantName: formData.businessName,
          role: formData.role,
          businessType: formData.businessType,
          teamSize: formData.teamSize,
          phone: phoneDigits || null
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create account');

      setRedirecting(true);
      setLoading(false);

      const userProfile = {
        fullName: formData.fullName,
        email: formData.email,
        businessName: formData.businessName,
        role: formData.role,
        businessType: formData.businessType,
        teamSize: formData.teamSize,
        phone: phoneToStore, // Store formatted version
        userId: data.userId,
        restaurantId: data.restaurantId
      };

      localStorage.setItem('drift-token', data.token);
      localStorage.setItem('drift-restaurant-id', data.restaurantId);
      localStorage.setItem('drift-user-profile', JSON.stringify(userProfile));

      const redirectUrl = `${RESTAURANT_URL}/onboarding?` + new URLSearchParams({
        restaurantId: data.restaurantId,
        businessName: formData.businessName,
        businessType: formData.businessType,
        email: formData.email,
        fullName: formData.fullName,
        role: formData.role,
        teamSize: formData.teamSize,
        phone: phoneToStore, // Pass formatted version
        token: data.token
      }).toString();
      
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 300);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      setLoading(false);
      setRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
      {/* Redirect Overlay */}
      <AnimatePresence>
        {redirecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl flex flex-col items-center"
            >
              <div className="relative">
                <div className="w-16 h-16 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-black rounded-full opacity-10" />
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-gray-700">Preparing your workspace</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left panel - DRIFT Branded */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden p-12 text-white flex-col">
        {/* Great Lakes pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Logo and Sign in */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-16"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-light tracking-tight">drift</span>
            </div>
            
            <button
              onClick={() => navigate('/login')}
              className="text-white/60 hover:text-white transition-colors text-sm flex items-center gap-1"
            >
              Sign in
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
          
          {/* Dynamic headline */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: step === 1 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-12"
          >
            <h1 className="text-5xl font-light leading-tight mb-4">
              {step === 1 ? (
                <>
                  Start your
                  <br />
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    journey with Drift
                  </span>
                </>
              ) : (
                <>
                  Tell us about
                  <br />
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    your business
                  </span>
                </>
              )}
            </h1>
            <p className="text-white/60 text-lg">
              {step === 1 
                ? "Create your account in seconds. No credit card required."
                : "Help us tailor the experience to your needs."}
            </p>
          </motion.div>
          
          {/* Progress with DRIFT style */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-white/40">Step {step} of 2</span>
              <span className="text-sm text-white/60">
                {step === 1 ? 'Account details' : 'Business profile'}
              </span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-white"
                initial={{ width: '0%' }}
                animate={{ width: step === 1 ? '50%' : '100%' }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          
          {/* Feature list - DRIFT style */}
          <div className="space-y-4 mb-12">
            {step === 1 ? (
              [
                { icon: <Zap className="w-5 h-5" />, text: 'Get started in minutes' },
                { icon: <TrendingUp className="w-5 h-5" />, text: 'Pay as you grow' },
                { icon: <Shield className="w-5 h-5" />, text: '256-bit encryption' }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <span className="text-white/80">{feature.text}</span>
                </motion.div>
              ))
            ) : (
              [
                { icon: <BarChart3 className="w-5 h-5" />, text: 'Tailored analytics' },
                { icon: <Sparkles className="w-5 h-5" />, text: 'Personalized recommendations' },
                { icon: <Clock className="w-5 h-5" />, text: 'Faster onboarding' }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <span className="text-white/80">{feature.text}</span>
                </motion.div>
              ))
            )}
          </div>
          
          {/* Great Lakes pride */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-auto"
          >
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Heart className="w-4 h-4" />
              <span>Built on the Great Lakes</span>
            </div>
            <div className="flex gap-6 text-white/20 text-xs mt-2">
              <span>SOC 2 Type II</span>
              <span>PCI DSS Level 1</span>
              <span>GDPR Compliant</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="w-full lg:w-1/2 flex items-start justify-center p-6 lg:p-12 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile sign in */}
          <div className="lg:hidden flex justify-end mb-4">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              Sign in
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Back button */}
          {step === 2 && (
            <button 
              onClick={handlePrevStep}
              className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1 transition-colors group"
            >
              <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
              Back to account details
            </button>
          )}

          {/* Step indicator - Mobile */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Step {step} of 2</span>
              <span className="text-sm text-gray-600">
                {step === 1 ? 'Account details' : 'Business profile'}
              </span>
            </div>
            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-black"
                initial={{ width: '0%' }}
                animate={{ width: step === 1 ? '50%' : '100%' }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-light text-gray-900 mb-2">
              {step === 1 ? 'Create your account' : 'Tell us about your business'}
            </h2>
            <p className="text-gray-400">
              {step === 1 
                ? "Join businesses using Drift to get paid faster"
                : "Help us personalize your experience"}
            </p>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={step === 2 ? handleSignup : (e) => e.preventDefault()} className="space-y-5">
            <AnimatePresence mode="wait">
              {/* Step 1: Account Details */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full name <span className="text-red-400">*</span>
                    </label>
                    <div className={`relative transition-all ${focusedField === 'name' ? 'scale-[1.02]' : ''}`}>
                      <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        focusedField === 'name' ? 'text-black' : 'text-gray-400'
                      }`} />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none transition-all bg-white"
                        placeholder="Alex Johnson"
                        required
                      />
                    </div>
                  </div>

                  {/* Email with validation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email address <span className="text-red-400">*</span>
                    </label>
                    <div className={`relative transition-all ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        focusedField === 'email' ? 'text-black' : 'text-gray-400'
                      }`} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none transition-all bg-white ${
                          emailValid === false
                            ? 'border-red-300 bg-red-50'
                            : emailValid === true
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-100'
                        }`}
                        placeholder="hello@business.com"
                        required
                      />
                      {emailValid === true && (
                        <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                      )}
                    </div>
                    {emailValid === false && (
                      <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-400">*</span>
                    </label>
                    <div className={`relative transition-all ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        focusedField === 'password' ? 'text-black' : 'text-gray-400'
                      }`} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handlePasswordChange}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-12 pr-12 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none transition-all bg-white"
                        placeholder="Create a strong password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {/* Password strength indicator */}
                    {formData.password && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${passwordStrength}%` }}
                              className={`h-full ${getStrengthColor()}`}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-500">
                            {getStrengthText()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm password <span className="text-red-400">*</span>
                    </label>
                    <div className={`relative transition-all ${focusedField === 'confirm' ? 'scale-[1.02]' : ''}`}>
                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        focusedField === 'confirm' ? 'text-black' : 'text-gray-400'
                      }`} />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        onFocus={() => setFocusedField('confirm')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl focus:outline-none transition-all bg-white ${
                          passwordsMatch === false
                            ? 'border-red-300 bg-red-50'
                            : passwordsMatch === true
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-100'
                        }`}
                        placeholder="Re-enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      {passwordsMatch === true && (
                        <CheckCircle className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                      )}
                    </div>
                    {passwordsMatch === false && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  {/* Continue button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="pt-4"
                  >
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={!isStep1Valid()}
                      className="w-full bg-black text-white py-4 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <span className="flex items-center justify-center gap-2">
                        Continue
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  </motion.div>
                </motion.div>
              )}

              {/* Step 2: Business Details */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business name <span className="text-red-400">*</span>
                    </label>
                    <div className={`relative transition-all ${focusedField === 'business' ? 'scale-[1.02]' : ''}`}>
                      <Building2 className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        focusedField === 'business' ? 'text-black' : 'text-gray-400'
                      }`} />
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                        onFocus={() => setFocusedField('business')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none transition-all bg-white"
                        placeholder="Trattoria Bellini"
                        required
                      />
                    </div>
                  </div>

                  {/* Business Type - Beautiful grid */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business type <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                      {businessTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFormData({...formData, businessType: type.id})}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            formData.businessType === type.id
                              ? `border-black bg-gradient-to-br ${type.gradient} text-white scale-105 shadow-lg`
                              : 'border-gray-100 hover:border-gray-200 bg-white'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1 text-lg ${
                            formData.businessType === type.id ? 'text-white' : type.color
                          }`}>
                            {type.icon}
                          </div>
                          <span className="text-xs">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your role <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full pl-12 pr-10 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none transition-all appearance-none bg-white"
                        required
                      >
                        <option value="">Select your role</option>
                        {roleOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.icon} {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 rotate-90" />
                    </div>
                  </div>

                  {/* Team Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team size <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={formData.teamSize}
                        onChange={(e) => setFormData({...formData, teamSize: e.target.value})}
                        className="w-full pl-12 pr-10 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none transition-all appearance-none bg-white"
                        required
                      >
                        <option value="">Select team size</option>
                        {teamSizeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.icon} {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 rotate-90" />
                    </div>
                  </div>

                  {/* Phone with auto-formatting */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone number <span className="text-gray-400">(optional)</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative w-24">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          value={formData.countryCode}
                          onChange={(e) => setFormData({...formData, countryCode: e.target.value})}
                          className="w-full pl-9 pr-2 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none transition-all appearance-none bg-white text-sm"
                        >
                          {countryCodes.map(cc => (
                            <option key={cc.code} value={cc.code}>{cc.code}</option>
                          ))}
                        </select>
                      </div>
                      <div className="relative flex-1">
                        <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                          phoneError ? 'text-red-400' : 'text-gray-400'
                        }`} />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          onBlur={handlePhoneBlur}
                          maxLength={14}
                          className={`w-full pl-9 pr-4 py-4 border-2 rounded-xl focus:border-black focus:outline-none transition-all ${
                            phoneError 
                              ? 'border-red-300 bg-red-50' 
                              : formData.phone && !phoneError
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-100'
                          }`}
                          placeholder="(555) 555-5555"
                        />
                        {formData.phone && !phoneError && (
                          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    {phoneError && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {phoneError}
                      </p>
                    )}
                    {formData.phone && !phoneError && (
                      <p className="text-xs text-green-600 mt-1">✓ Valid phone number</p>
                    )}
                  </div>

                  {/* Terms agreement */}
                  <div className="flex items-start gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, agreeTerms: !formData.agreeTerms})}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${
                        formData.agreeTerms
                          ? 'bg-black border-black text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {formData.agreeTerms && <CheckCircle className="w-4 h-4" />}
                    </button>
                    <label className="text-sm text-gray-500">
                      I agree to the{' '}
                      <button 
                        type="button"
                        onClick={() => {
                          setModalContent('terms');
                          setShowTermsModal(true);
                        }}
                        className="text-gray-900 hover:text-gray-700 font-medium underline decoration-gray-200 hover:decoration-gray-400 transition-all"
                      >
                        Terms of Service
                      </button>
                      {' '}and{' '}
                      <button 
                        type="button"
                        onClick={() => {
                          setModalContent('privacy');
                          setShowTermsModal(true);
                        }}
                        className="text-gray-900 hover:text-gray-700 font-medium underline decoration-gray-200 hover:decoration-gray-400 transition-all"
                      >
                        Privacy Policy
                      </button>
                    </label>
                  </div>

                  {/* Submit button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="pt-4"
                  >
                    <button
                      type="submit"
                      disabled={loading || !isStep2Valid() || !formData.agreeTerms}
                      className="w-full bg-black text-white py-4 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden relative"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating account...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Create account
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Security badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex items-center justify-center gap-4 text-xs text-gray-300"
          >
            <span>🔒 256-bit SSL</span>
            <span>✓ PCI Compliant</span>
            <span>🛡️ SOC 2</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Terms & Privacy Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-2xl font-light">
                  {modalContent === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                </h3>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh] prose prose-sm">
                {modalContent === 'terms' ? (
                  <>
                    <h4>1. Agreement to Terms</h4>
                    <p>By accessing or using Drift, you agree to be bound by these Terms of Service.</p>
                    <h4>2. Description of Service</h4>
                    <p>Drift provides payment processing and restaurant management tools.</p>
                    <h4>3. Fees and Payments</h4>
                    <p>Transaction fees are clearly displayed and deducted automatically.</p>
                    <h4>4. User Responsibilities</h4>
                    <p>You are responsible for maintaining account security and providing accurate information.</p>
                    <h4>5. Termination</h4>
                    <p>You may cancel your account at any time. We may suspend accounts for violations.</p>
                  </>
                ) : (
                  <>
                    <h4>Your Data Is Yours</h4>
                    <p>We don't sell your data. Period.</p>
                    <h4>What We Collect</h4>
                    <p>Only what's necessary to process payments: name, email, business information.</p>
                    <h4>How We Use It</h4>
                    <p>To provide services, improve our platform, and communicate important updates.</p>
                    <h4>Security</h4>
                    <p>256-bit encryption, PCI compliant, SOC 2 certified.</p>
                    <h4>Your Rights</h4>
                    <p>You can export or delete your data anytime.</p>
                  </>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}