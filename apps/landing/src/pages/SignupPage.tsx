import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
} from 'lucide-react';

export function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    businessName: '',
    role: '',
    businessType: '',
    teamSize: '',
    agreeTerms: false
  });

  // Business types with icons
  const businessTypes = [
    { id: 'restaurant', label: 'Restaurant', icon: '🍽️', color: 'bg-orange-50 text-orange-600' },
    { id: 'cafe', label: 'Café', icon: '☕', color: 'bg-amber-50 text-amber-600' },
    { id: 'bar', label: 'Bar / Pub', icon: '🍺', color: 'bg-yellow-50 text-yellow-600' },
    { id: 'foodtruck', label: 'Food Truck', icon: '🚚', color: 'bg-blue-50 text-blue-600' },
    { id: 'bakery', label: 'Bakery', icon: '🥐', color: 'bg-rose-50 text-rose-600' },
    { id: 'brewery', label: 'Brewery', icon: '🍺', color: 'bg-amber-50 text-amber-600' },
    { id: 'winery', label: 'Winery', icon: '🍷', color: 'bg-purple-50 text-purple-600' },
    { id: 'popup', label: 'Pop-up', icon: '🎪', color: 'bg-pink-50 text-pink-600' },
    { id: 'other', label: 'Other', icon: '✨', color: 'bg-gray-50 text-gray-600' }
  ];

  const roleOptions = [
    { value: 'owner', label: 'Owner / Founder', icon: '👑' },
    { value: 'manager', label: 'Manager', icon: '📊' },
    { value: 'chef', label: 'Chef', icon: '👨‍🍳' },
    { value: 'marketing', label: 'Marketing', icon: '📈' },
    { value: 'operations', label: 'Operations', icon: '⚙️' },
    { value: 'other', label: 'Other', icon: '🤝' }
  ];

  const teamSizeOptions = [
    { value: '1', label: 'Just me', icon: '👤' },
    { value: '2-5', label: '2-5 people', icon: '👥' },
    { value: '6-20', label: '6-20 people', icon: '👪' },
    { value: '21-50', label: '21-50 people', icon: '🏢' },
    { value: '51-200', label: '51-200 people', icon: '🏛️' },
    { value: '201+', label: '201+ people', icon: '🌆' }
  ];

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]+/)) strength += 25;
    if (password.match(/[A-Z]+/)) strength += 25;
    if (password.match(/[0-9]+/)) strength += 25;
    if (password.match(/[$@#&!]+/)) strength += 25; // Extra for special chars
    return Math.min(strength, 100);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData({ ...formData, password });
    setPasswordStrength(checkPasswordStrength(password));
  };

  const getStrengthColor = () => {
    if (passwordStrength < 50) return 'bg-red-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength < 50) return 'Weak';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const API_URL = 'https://drift-api-7vs7.onrender.com';
  const RESTAURANT_URL = 'https://drift-restaurant.onrender.com';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
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
          teamSize: formData.teamSize
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create account');

      const userProfile = {
        fullName: formData.fullName,
        email: formData.email,
        businessName: formData.businessName,
        role: formData.role,
        businessType: formData.businessType,
        teamSize: formData.teamSize,
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
        token: data.token
      }).toString();
      
      window.location.href = redirectUrl;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
      {/* Left panel - Enhanced value proposition */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden p-12 text-white flex-col">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-16"
          >
            <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xl font-light tracking-tight">drift</span>
          </motion.div>
          
          {/* Main headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h1 className="text-5xl font-light leading-tight mb-4">
              The future of
              <br />
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                business payments
              </span>
            </h1>
            <p className="text-white/60 text-lg">
              Join thousands of businesses using Drift to get paid faster and grow smarter.
            </p>
          </motion.div>
          
          {/* Feature list with icons */}
          <div className="space-y-6 mb-12">
            {[
              { icon: '🚀', title: 'Go live in minutes', desc: 'No contracts, no hidden fees' },
              { icon: '💳', title: '2.5% per transaction', desc: 'Volume discounts available' },
              { icon: '📊', title: 'Real-time analytics', desc: 'Know your business better' },
              { icon: '🔒', title: 'Bank-level security', desc: 'PCI compliant, 256-bit encryption' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-xl backdrop-blur">
                  {feature.icon}
                </div>
                <div>
                  <div className="font-medium mb-1">{feature.title}</div>
                  <div className="text-white/40 text-sm">{feature.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-auto"
          >
            <div className="flex items-center gap-2 text-white/40 text-sm mb-4">
              <span className="flex -space-x-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-white/10 border-2 border-gray-800" />
                ))}
              </span>
              <span>Trusted by 10,000+ businesses</span>
            </div>
            <div className="flex gap-8 text-white/20 text-xs">
              <span>SOC 2 Type II</span>
              <span>PCI DSS Level 1</span>
              <span>GDPR Compliant</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel - Enhanced form */}
      <div className="w-full lg:w-1/2 flex items-start justify-center p-6 lg:p-12 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Back button */}
          <button 
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 hover:text-gray-600 mb-8 flex items-center gap-1 transition-colors group"
          >
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </button>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-light text-gray-900 mb-2">Create your account</h2>
            <p className="text-gray-400">Join businesses using Drift to get paid faster</p>
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

          <form onSubmit={handleSignup} className="space-y-5">
            {/* Full Name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
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
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
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
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none transition-all bg-white"
                  placeholder="hello@business.com"
                  required
                />
              </div>
            </motion.div>

            {/* Password with strength meter */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-400">*</span>
              </label>
              <div className={`relative transition-all ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                  focusedField === 'password' ? 'text-black' : 'text-gray-400'
                }`} />
                <input
                  type="password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none transition-all bg-white"
                  placeholder="Create a strong password"
                  required
                />
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
                  <p className="text-xs text-gray-400">
                    Minimum 8 characters with 1 number and 1 special character
                  </p>
                </div>
              )}
            </motion.div>

            {/* Business Name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
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
            </motion.div>

            {/* Business Type - Grid with icons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {businessTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({...formData, businessType: type.id})}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.businessType === type.id
                        ? 'border-black bg-gray-50 scale-105'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className={`w-8 h-8 ${type.color} rounded-lg flex items-center justify-center mx-auto mb-1 text-lg`}>
                      {type.icon}
                    </div>
                    <span className="text-xs">{type.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Role - Enhanced select */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your role
              </label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none transition-all appearance-none bg-white"
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
            </motion.div>

            {/* Team Size - Enhanced select */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team size
              </label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.teamSize}
                  onChange={(e) => setFormData({...formData, teamSize: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none transition-all appearance-none bg-white"
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
            </motion.div>

            {/* Terms agreement - Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex items-start gap-3 pt-2"
            >
              <button
                type="button"
                onClick={() => setFormData({...formData, agreeTerms: !formData.agreeTerms})}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  formData.agreeTerms
                    ? 'bg-black border-black text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {formData.agreeTerms && <CheckCircle className="w-4 h-4" />}
              </button>
              <label className="text-sm text-gray-500">
                I agree to the{' '}
                <button type="button" className="text-gray-900 hover:text-gray-700 font-medium">
                  Terms of Service
                </button>
                {' '}and{' '}
                <button type="button" className="text-gray-900 hover:text-gray-700 font-medium">
                  Privacy Policy
                </button>
              </label>
            </motion.div>

            {/* Submit button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <button
                type="submit"
                disabled={loading || !formData.agreeTerms}
                className="w-full bg-black text-white py-4 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative group overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={false}
                />
              </button>
            </motion.div>
          </form>

          {/* Sign in link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-center text-sm text-gray-400 mt-8"
          >
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/login')}
              className="text-gray-900 font-medium hover:text-gray-700 transition-colors"
            >
              Sign in
            </button>
          </motion.p>

          {/* Quick security badges */}
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
    </div>
  );
}