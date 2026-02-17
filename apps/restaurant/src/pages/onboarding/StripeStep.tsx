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
  ChevronRight
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
  const [activeSection, setActiveSection] = useState<'business' | 'bank'>('business');
  
  // Simple form state - organized by section
  const [formData, setFormData] = useState({
    // Business info
    fullName: '',
    email: '',
    phone: '',
    businessName: '',
    businessAddress: '',
    taxId: '',
    website: '',
    
    // Bank info
    accountHolderName: '',
    routingNumber: '',
    accountNumber: '',
    confirmAccountNumber: '',
    accountType: 'checking'
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
      formData.businessAddress.trim() !== ''
    );
  };

  const isBankInfoValid = () => {
    return (
      formData.accountHolderName.trim() !== '' &&
      formData.routingNumber.trim().length === 9 &&
      formData.accountNumber.trim().length >= 4 &&
      formData.accountNumber === formData.confirmAccountNumber
    );
  };

  const canContinue = () => {
    return isBusinessInfoValid() && isBankInfoValid();
  };

  // Format routing number (XXX-XXX-XXX)
  const formatRoutingNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 9);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 9)}`;
  };

  // Format account number (show only last 4)
  const formatAccountNumber = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 17);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      
      // Create Stripe account with all info
      const response = await fetch(`${API_URL}/api/stripe/create-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          // Business info
          email: formData.email,
          businessName: formData.businessName,
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.businessAddress,
          taxId: formData.taxId || undefined,
          website: formData.website || `https://driftpos.com/restaurant/${restaurantId}`,
          
          // Bank info
          bankAccount: {
            accountHolderName: formData.accountHolderName,
            routingNumber: formData.routingNumber.replace(/\D/g, ''),
            accountNumber: formData.accountNumber.replace(/\D/g, ''),
            accountType: formData.accountType
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
        ...formData
      });
      
      setSuccess(true);
      
      // Move to next step
      setTimeout(() => {
        onNext();
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          Where should we send your earnings?
        </p>
      </div>

      {/* Success message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">Payment setup complete! Redirecting...</p>
        </motion.div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Section tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSection('business')}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
            activeSection === 'business'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Business info
        </button>
        <button
          onClick={() => setActiveSection('bank')}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
            activeSection === 'bank'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Bank details
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* BUSINESS INFO SECTION */}
        {activeSection === 'business' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
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
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                  placeholder="Alex Johnson"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                  placeholder="owner@restaurant.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                  placeholder="(555) 555-5555"
                />
              </div>
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                  placeholder="Trattoria Bellini"
                />
              </div>
            </div>

            {/* Business Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.businessAddress}
                  onChange={(e) => setFormData({...formData, businessAddress: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                  placeholder="123 Main St, Chicago, IL 60654"
                />
              </div>
            </div>

            {/* Tax ID (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax ID / EIN <span className="text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                  placeholder="XX-XXXXXXX"
                />
              </div>
            </div>

            {/* Website (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website <span className="text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                  placeholder="https://yourrestaurant.com"
                />
              </div>
            </div>

            {/* Next section button */}
            <button
              type="button"
              onClick={() => setActiveSection('bank')}
              className="w-full mt-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              Continue to bank details
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* BANK INFO SECTION */}
        {activeSection === 'bank' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
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
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none"
                  placeholder="Name on account"
                />
              </div>
            </div>

            {/* Routing number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Routing number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formatRoutingNumber(formData.routingNumber)}
                  onChange={(e) => setFormData({...formData, routingNumber: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none font-mono"
                  placeholder="123-456-789"
                  maxLength={11}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">9-digit number from your bank</p>
            </div>

            {/* Account number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formatAccountNumber(formData.accountNumber)}
                  onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none font-mono"
                  placeholder="••••••••1234"
                />
              </div>
            </div>

            {/* Confirm account number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm account number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formatAccountNumber(formData.confirmAccountNumber)}
                  onChange={(e) => setFormData({...formData, confirmAccountNumber: e.target.value})}
                  className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none font-mono ${
                    formData.confirmAccountNumber && formData.accountNumber !== formData.confirmAccountNumber
                      ? 'border-red-300 bg-red-50'
                      : formData.confirmAccountNumber && formData.accountNumber === formData.confirmAccountNumber
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-100'
                  }`}
                  placeholder="Re-enter account number"
                />
                {formData.confirmAccountNumber && formData.accountNumber === formData.confirmAccountNumber && (
                  <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {formData.confirmAccountNumber && formData.accountNumber !== formData.confirmAccountNumber && (
                <p className="text-xs text-red-500 mt-1">Account numbers don't match</p>
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

            {/* Back to business button */}
            <button
              type="button"
              onClick={() => setActiveSection('business')}
              className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              ← Back to business info
            </button>
          </motion.div>
        )}

        {/* Summary of collected info */}
        {isBusinessInfoValid() && isBankInfoValid() && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 my-4">
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>All set! Ready to continue</span>
            </div>
            <p className="text-xs text-green-600">
              We have all the information needed to set up your payments.
            </p>
          </div>
        )}

        {/* Trust message */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 my-6">
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

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onPrev}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={loading || success || !canContinue()}
            className="px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up payments...
              </>
            ) : (
              <>
                Complete setup
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
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