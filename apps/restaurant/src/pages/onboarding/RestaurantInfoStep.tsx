import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Briefcase, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Heart,
  Sparkles
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

import { config } from '../../lib/config';

interface Props {
  restaurantId: string;
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function RestaurantInfoStep({ restaurantId, data, updateData, onNext, onPrev }: Props) {
  const [formData, setFormData] = useState({
    restaurantName: '',
    email: '',
    phone: '',
    address: { line1: '', city: '', state: '', postal_code: '' },
    fullName: '',
    role: '',
    teamSize: '',
    taxPercent: '8.875',
  });

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [postalCodeError, setPostalCodeError] = useState<string | null>(null);

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

  const formatPostalCode = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    setFormData((prev) => ({ ...prev, address: { ...prev.address, postal_code: digits } }));
    if (digits.length === 0) setPostalCodeError(null);
    else if (digits.length !== 5 && digits.length !== 9) setPostalCodeError('ZIP must be 5 or 9 digits');
    else setPostalCodeError(null);
  };

  const validatePostalCodeBlur = () => {
    const digits = (formData.address.postal_code || '').replace(/\D/g, '');
    if (digits.length === 0) setPostalCodeError(null);
    else if (digits.length !== 5 && digits.length !== 9) setPostalCodeError('ZIP must be 5 or 9 digits');
    else setPostalCodeError(null);
  };

  // Load from ALL sources on mount
  useEffect(() => {
    console.log('📊 RestaurantInfoStep received data:', data);
    
    let mergedData: any = {};
    
    // 1. Load from drift-user-profile first (from signup)
    const userProfile = localStorage.getItem('drift-user-profile');
    if (userProfile) {
      try {
        const profile = JSON.parse(userProfile);
        mergedData = { ...mergedData, ...profile };
      } catch (e) {
        console.error('Error parsing user profile:', e);
      }
    }
    
    // 2. Load from onboarding progress
    const onboarding = localStorage.getItem('drift_onboarding');
    if (onboarding) {
      try {
        const parsed = JSON.parse(onboarding);
        mergedData = { ...mergedData, ...parsed };
      } catch (e) {
        console.error('Error parsing onboarding:', e);
      }
    }
    
    // 3. Props override everything
    if (data) {
      mergedData = { ...mergedData, ...data };
    }
    
    // Format phone number if it exists
    let phoneNumber = mergedData.phone || '';
    if (phoneNumber) {
      // Check if it needs formatting
      if (!phoneNumber.includes('(') && !phoneNumber.includes('-')) {
        const numbers = phoneNumber.replace(/\D/g, '');
        if (numbers.length > 0) {
          phoneNumber = formatPhoneNumber(numbers);
        }
      }
    }
    
    const addr = mergedData.address;
    const addressObj =
      addr && typeof addr === 'object' && !Array.isArray(addr)
        ? {
            line1: addr.line1 || '',
            city: addr.city || '',
            state: addr.state || '',
            postal_code: addr.postal_code || ''
          }
        : {
            line1: typeof addr === 'string' ? addr : '',
            city: '',
            state: '',
            postal_code: ''
          };
    setFormData({
      restaurantName: mergedData.restaurantName || mergedData.businessName || mergedData.name || '',
      email: mergedData.email || '',
      phone: phoneNumber,
      address: addressObj,
      fullName: mergedData.fullName || '',
      role: mergedData.role || '',
      teamSize: mergedData.teamSize || '',
      taxPercent: mergedData.taxPercent || '8.875',
    });
  }, [data]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.phone && !validatePhone(formData.phone)) return;
    if (!formData.address.line1?.trim() || !formData.address.city?.trim() || !formData.address.state?.trim() || !formData.address.postal_code?.trim()) return;
    const zipDigits = formData.address.postal_code.replace(/\D/g, '');
    if (zipDigits.length !== 5 && zipDigits.length !== 9) {
      setPostalCodeError('ZIP must be 5 or 9 digits');
      return;
    }
    const taxPercent = Number(formData.taxPercent);
    if (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 30) {
      setSaveError('Sales tax must be between 0 and 30 percent.');
      return;
    }
    setPostalCodeError(null);
    setSaveError(null);

    const dataToSave = {
      name: formData.restaurantName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      fullName: formData.fullName,
      role: formData.role,
      teamSize: formData.teamSize
    };
    updateData(dataToSave);

    const onboarding = JSON.parse(localStorage.getItem('drift_onboarding') || '{}');
    localStorage.setItem('drift_onboarding', JSON.stringify({ ...onboarding, ...dataToSave }));
    const profile = JSON.parse(localStorage.getItem('drift-user-profile') || '{}');
    localStorage.setItem('drift-user-profile', JSON.stringify({ ...profile, ...dataToSave }));

    const addressStr = [formData.address.line1, formData.address.city, formData.address.state, formData.address.postal_code].filter(Boolean).join(', ');
    const token = localStorage.getItem('drift-token');
    if (token) {
      setSaving(true);
      try {
        const res = await fetch(`${config.apiUrl}/api/restaurants/${restaurantId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: formData.restaurantName,
            address: addressStr,
            phone: formData.phone || undefined,
            taxRate: Number(formData.taxPercent) / 100,
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setSaveError(err.error || 'Failed to save restaurant info');
          setSaving(false);
          return;
        }
      } catch {
        setSaveError('Could not connect. Please try again.');
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-black to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-light mb-2">Restaurant Information</h2>
        <p className="text-gray-400">Tell us about your restaurant</p>
      </div>

      {/* User info summary from signup - Beautiful card */}
      {(formData.fullName || formData.role || formData.teamSize) && (
        <Card className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">From your signup</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {formData.fullName && (
              <span className="flex items-center gap-1 text-blue-800">
                <User className="w-4 h-4 text-blue-600" />
                {formData.fullName}
              </span>
            )}
            {formData.role && (
              <span className="flex items-center gap-1 text-blue-800">
                <Briefcase className="w-4 h-4 text-blue-600" />
                {formData.role.replace('_', ' ')}
              </span>
            )}
            {formData.teamSize && (
              <span className="flex items-center gap-1 text-blue-800">
                <Users className="w-4 h-4 text-blue-600" />
                {formData.teamSize} people
              </span>
            )}
          </div>
        </Card>
      )}

      <Card padding="xl" className="border-2 border-gray-100 hover:border-gray-200 transition-all">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Restaurant Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.restaurantName}
              onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
              placeholder="e.g., Joe's Pizza"
            />
            {formData.restaurantName && formData.restaurantName !== data?.name && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Ready to save
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
              placeholder="contact@joespizza.com"
            />
          </div>

          {/* Phone with validation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number <span className="text-gray-400">(optional)</span>
            </label>
            <div className="relative">
              <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                phoneError ? 'text-red-400' : 'text-gray-400'
              }`} />
              <input
                type="tel"
                value={formData.phone}
                onChange={handlePhoneChange}
                onBlur={handlePhoneBlur}
                maxLength={14}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all ${
                  phoneError 
                    ? 'border-red-300 bg-red-50' 
                    : formData.phone && !phoneError
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200'
                }`}
                placeholder="(555) 123-4567"
              />
              {formData.phone && !phoneError && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
            </div>
            {phoneError && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {phoneError}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Enter 10-digit US/Canada number
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sales tax <span className="text-gray-400">(percent)</span>
            </label>
            <input
              type="number"
              min="0"
              max="30"
              step="0.001"
              required
              value={formData.taxPercent}
              onChange={(e) => setFormData({ ...formData, taxPercent: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">
              Applied to every table order. 8.875 is a starting point — use your local rate.
            </p>
          </div>

          {/* Address - required for payouts later */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business address <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">Used for payouts and verification.</p>
            <div className="space-y-3">
              <input
                type="text"
                required
                value={formData.address.line1}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, line1: e.target.value } })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
                placeholder="Street address"
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={formData.address.city}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  placeholder="City"
                />
                <input
                  type="text"
                  required
                  value={formData.address.state}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  placeholder="State"
                />
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={9}
                    value={formData.address.postal_code}
                    onChange={(e) => formatPostalCode(e.target.value)}
                    onBlur={validatePostalCodeBlur}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all ${
                      postalCodeError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="12345 or 12345-6789"
                  />
                  {postalCodeError && (
                    <p className="text-xs text-red-500 mt-1">{postalCodeError}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hidden fields to preserve signup data */}
          <input type="hidden" name="fullName" value={formData.fullName} />
          <input type="hidden" name="role" value={formData.role} />
          <input type="hidden" name="teamSize" value={formData.teamSize} />

          {saveError && (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {saveError}
            </p>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onPrev} className="flex-1 group" disabled={saving}>
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back
            </Button>
            <Button 
              type="submit" 
              className="flex-1 group"
              disabled={saving ||
                !!phoneError ||
                !formData.address.line1?.trim() ||
                !formData.address.city?.trim() ||
                !formData.address.state?.trim() ||
                !formData.address.postal_code?.trim() ||
                (formData.address.postal_code.replace(/\D/g, '').length !== 5 && formData.address.postal_code.replace(/\D/g, '').length !== 9) ||
                !!postalCodeError
              }
            >
              {saving ? 'Saving…' : 'Continue'}
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </form>
      </Card>

      {/* Great Lakes pride */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-300">
        <Heart className="w-3 h-3" />
        <span>Built on the Great Lakes</span>
      </div>
    </motion.div>
  );
}