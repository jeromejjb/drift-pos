import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  CreditCard, 
  Mail, 
  Phone, 
  MapPin,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Heart,
  AlertCircle,
  Briefcase,
  Globe,
  User,
  Landmark,
  Wallet,
  FileText,
  ChevronRight,
  Calendar,
  Hash,
  Shield,
  CheckSquare
} from 'lucide-react';

interface StripeStepProps {
  restaurantId: string;
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function StripeStep({ restaurantId, data, updateData, onNext, onPrev }: StripeStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<'business' | 'bank' | 'verification'>('business');
  
  // Complete form state - everything Stripe needs
  const [formData, setFormData] = useState({
    // Business info
    fullName: '',
    email: '',
    phone: '',
    businessName: '',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessZip: '',
    taxId: '',
    website: '',
    
    // Bank info
    accountHolderName: '',
    routingNumber: '',
    accountNumber: '',
    confirmAccountNumber: '',
    accountType: 'checking',
    
    // Identity verification (required by Stripe)
    dobMonth: '',
    dobDay: '',
    dobYear: '',
    ssnLast4: '', // Last 4 of SSN for US accounts
    acceptTerms: false,
    
    // Optional but helpful
    idDocument: null as File | null,
  });

  // Load saved data on mount
  useEffect(() => {
    const saved = { ...formData };

    // From user profile
    const userProfile = localStorage.getItem('drift-user-profile');
    if (userProfile) {
      try {
        const profile = JSON.parse(userProfile);
        saved.fullName = profile.fullName || '';
        saved.email = profile.email || '';
        saved.phone = profile.phone || '';
        saved.businessName = profile.businessName || '';
      } catch (e) {}
    }

    // From onboarding data
    if (data) {
      saved.businessName = data.businessName || data.restaurantName || saved.businessName;
      saved.email = data.email || saved.email;
      saved.phone = data.phone || saved.phone;
      saved.accountHolderName = data.accountHolderName || saved.fullName;
    }

    setFormData(saved);
  }, [data]);

  // Validation
  const isBusinessInfoValid = () => {
    return (
      formData.fullName.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.phone.trim() !== '' &&
      formData.businessName.trim() !== '' &&
      formData.businessAddress.trim() !== '' &&
      formData.businessCity.trim() !== '' &&
      formData.businessState.trim() !== '' &&
      formData.businessZip.trim() !== ''
    );
  };

  const isBankInfoValid = () => {
    const routingDigits = formData.routingNumber.replace(/\D/g, '');
    const accountDigits = formData.accountNumber.replace(/\D/g, '');
    
    return (
      formData.accountHolderName.trim() !== '' &&
      routingDigits.length === 9 &&
      accountDigits.length >= 4 &&
      accountDigits.length <= 17 &&
      formData.accountNumber === formData.confirmAccountNumber
    );
  };

  const isVerificationValid = () => {
    const dobComplete = 
      formData.dobMonth && 
      formData.dobDay && 
      formData.dobYear &&
      parseInt(formData.dobMonth) >= 1 && 
      parseInt(formData.dobMonth) <= 12 &&
      parseInt(formData.dobDay) >= 1 && 
      parseInt(formData.dobDay) <= 31 &&
      parseInt(formData.dobYear) >= 1900 && 
      parseInt(formData.dobYear) <= new Date().getFullYear() - 18;
    
    const ssnValid = formData.ssnLast4.replace(/\D/g, '').length === 4;
    
    return dobComplete && ssnValid && formData.acceptTerms;
  };

  const canContinue = () => {
    return isBusinessInfoValid() && isBankInfoValid() && isVerificationValid();
  };

  // Formatters
  const formatRoutingNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 9);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 9)}`;
  };

  const formatAccountNumber = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 17);
  };

  const formatSSN = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      
      const response = await fetch(`${API_URL}/api/stripe/create-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          email: formData.email,
          businessName: formData.businessName,
          fullName: formData.fullName,
          phone: formData.phone,
          address: {
            line1: formData.businessAddress,
            city: formData.businessCity,
            state: formData.businessState,
            postal_code: formData.businessZip,
            country: 'US'
          },
          taxId: formData.taxId,
          website: formData.website,
          
          // Identity verification
          dob: {
            day: parseInt(formData.dobDay),
            month: parseInt(formData.dobMonth),
            year: parseInt(formData.dobYear)
          },
          ssnLast4: formData.ssnLast4.replace(/\D/g, ''),
          
          // Bank account
          bankAccount: {
            accountHolderName: formData.accountHolderName,
            routingNumber: formData.routingNumber.replace(/\D/g, ''),
            accountNumber: formData.accountNumber.replace(/\D/g, ''),
            accountType: formData.accountType
          },
          
          // Terms acceptance
          tosAcceptance: {
            date: Math.floor(Date.now() / 1000),
            ip: await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip).catch(() => '0.0.0.0')
          }
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to set up payments');
      }

      // Save the account info
      updateData({ 
        stripeAccountId: result.accountId,
        paymentsEnabled: true,
        onboardingComplete: true,
        ...formData
      });
      
      localStorage.setItem('drift_onboarding_complete', 'true');
      setSuccess(true);
      
      setTimeout(() => {
        window.location.href = `/dashboard/${restaurantId}`;
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Progress indicator
  const sections = [
    { id: 'business', label: 'Business', completed: isBusinessInfoValid() },
    { id: 'bank', label: 'Bank', completed: isBankInfoValid() },
    { id: 'verification', label: 'Verify', completed: isVerificationValid() },
  ];

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Step indicator */}
      <div className="text-center mb-6">
        <span className="text-sm text-gray-400 bg-gray-100 px-4 py-2 rounded-full">
          Step 6 of 7 · Payment Setup
        </span>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-light text-gray-900 mb-3">Set up payouts</h1>
        <p className="text-base text-gray-500 max-w-md mx-auto">
          We need a few details to verify your identity and set up payments.
        </p>
      </div>

      {/* Progress tracker */}
      <div className="flex items-center justify-between mb-8 px-2">
        {sections.map((section, i) => (
          <div key={section.id} className="flex items-center">
            <button
              onClick={() => setActiveSection(section.id as any)}
              className={`flex items-center gap-2 ${
                activeSection === section.id ? 'text-black' : 'text-gray-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                section.completed 
                  ? 'bg-green-500 text-white' 
                  : activeSection === section.id
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {section.completed ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-sm hidden md:block">{section.label}</span>
            </button>
            {i < sections.length - 1 && (
              <div className={`w-12 h-0.5 mx-2 ${
                section.completed && sections[i + 1].completed 
                  ? 'bg-green-500' 
                  : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Success message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">Payment setup complete! Redirecting to dashboard...</p>
        </motion.div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* BUSINESS INFO SECTION */}
        {activeSection === 'business' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-gray-50 rounded-xl p-4 mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Building2 className="w-4 h-4" />
                <span>Your business information</span>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your full name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                placeholder="Alex Johnson"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                placeholder="owner@restaurant.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                placeholder="(555) 555-5555"
              />
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                placeholder="Trattoria Bellini"
              />
            </div>

            {/* Business Address - Line 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street address <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.businessAddress}
                onChange={(e) => setFormData({...formData, businessAddress: e.target.value})}
                className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                placeholder="123 Main St"
              />
            </div>

            {/* City, State, Zip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <input
                  type="text"
                  required
                  value={formData.businessCity}
                  onChange={(e) => setFormData({...formData, businessCity: e.target.value})}
                  className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                  placeholder="Chicago"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                <input
                  type="text"
                  required
                  value={formData.businessState}
                  onChange={(e) => setFormData({...formData, businessState: e.target.value})}
                  className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                  placeholder="IL"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP *</label>
                <input
                  type="text"
                  required
                  value={formData.businessZip}
                  onChange={(e) => setFormData({...formData, businessZip: e.target.value})}
                  className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                  placeholder="60654"
                  maxLength={5}
                />
              </div>
            </div>

            {/* Tax ID (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax ID / EIN <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                placeholder="XX-XXXXXXX"
              />
            </div>

            {/* Website (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                placeholder="https://yourrestaurant.com"
              />
            </div>

            {/* Next button */}
            <button
              type="button"
              onClick={() => setActiveSection('bank')}
              disabled={!isBusinessInfoValid()}
              className="w-full mt-4 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to bank details
            </button>
          </motion.div>
        )}

        {/* BANK INFO SECTION */}
        {activeSection === 'bank' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-gray-50 rounded-xl p-4 mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Landmark className="w-4 h-4" />
                <span>Where should we send your money?</span>
              </div>
            </div>

            {/* Account holder name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account holder name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.accountHolderName}
                onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})}
                className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                placeholder="Name on account"
              />
            </div>

            {/* Routing number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Routing number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formatRoutingNumber(formData.routingNumber)}
                onChange={(e) => setFormData({...formData, routingNumber: e.target.value})}
                className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none font-mono"
                placeholder="123-456-789"
                maxLength={11}
              />
              <p className="text-xs text-gray-400 mt-1">9-digit number from your bank</p>
            </div>

            {/* Account number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formatAccountNumber(formData.accountNumber)}
                onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none font-mono"
                placeholder="••••••••1234"
              />
            </div>

            {/* Confirm account number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm account number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formatAccountNumber(formData.confirmAccountNumber)}
                onChange={(e) => setFormData({...formData, confirmAccountNumber: e.target.value})}
                className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none font-mono ${
                  formData.confirmAccountNumber && formData.accountNumber !== formData.confirmAccountNumber
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-100 focus:border-black'
                }`}
                placeholder="Re-enter account number"
              />
              {formData.confirmAccountNumber && formData.accountNumber === formData.confirmAccountNumber && (
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Numbers match
                </p>
              )}
            </div>

            {/* Account type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, accountType: 'checking'})}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.accountType === 'checking'
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="block font-medium">Checking</span>
                  <span className="text-xs text-gray-400">Everyday account</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, accountType: 'savings'})}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.accountType === 'savings'
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="block font-medium">Savings</span>
                  <span className="text-xs text-gray-400">Interest account</span>
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setActiveSection('business')}
                className="flex-1 py-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('verification')}
                disabled={!isBankInfoValid()}
                className="flex-1 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* VERIFICATION SECTION */}
        {activeSection === 'verification' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-gray-50 rounded-xl p-4 mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Identity verification (required by law)</span>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of birth <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <select
                    required
                    value={formData.dobMonth}
                    onChange={(e) => setFormData({...formData, dobMonth: e.target.value})}
                    className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                  >
                    <option value="">Month</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    required
                    value={formData.dobDay}
                    onChange={(e) => setFormData({...formData, dobDay: e.target.value})}
                    className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    required
                    value={formData.dobYear}
                    onChange={(e) => setFormData({...formData, dobYear: e.target.value})}
                    className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 100 }, (_, i) => {
                      const year = new Date().getFullYear() - i - 18;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Last 4 of SSN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last 4 of SSN <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                required
                value={formatSSN(formData.ssnLast4)}
                onChange={(e) => setFormData({...formData, ssnLast4: e.target.value})}
                className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none font-mono"
                placeholder="••••"
                maxLength={4}
              />
              <p className="text-xs text-gray-400 mt-1">We only need the last 4 digits for verification</p>
            </div>

            {/* Terms acceptance */}
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({...formData, acceptTerms: e.target.checked})}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                />
                <div>
                  <span className="text-sm font-medium">I agree to the terms of service</span>
                  <p className="text-xs text-gray-500 mt-1">
                    By checking this box, you agree to Stripe's Connected Account Agreement and authorize Drift to collect payments on your behalf.
                  </p>
                </div>
              </label>
            </div>

            {/* Summary */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 my-4">
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>All information complete!</span>
              </div>
              <p className="text-xs text-green-600">
                You're ready to set up payments. Click Complete setup to finish.
              </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setActiveSection('bank')}
                className="flex-1 py-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading || success || !canContinue()}
                className="flex-1 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete setup
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Trust message */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">Your information is secure</p>
              <p className="text-xs text-blue-600 mt-1">
                All data is encrypted and transmitted securely. We use Stripe, a trusted payment processor used by millions of businesses.
              </p>
            </div>
          </div>
        </div>

        {/* Great Lakes branding */}
        <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-gray-100">
          <span className="text-sm text-gray-400">Built with</span>
          <Heart className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">on the Great Lakes</span>
        </div>
      </form>
    </div>
  );
}