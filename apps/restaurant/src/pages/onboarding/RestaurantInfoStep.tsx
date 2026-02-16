import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Mail, Phone, MapPin, ChevronRight, ChevronLeft, User, Briefcase, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface Props {
  restaurantId: string;
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function RestaurantInfoStep({ data, updateData, onNext, onPrev }: Props) {
  const [formData, setFormData] = useState({
    restaurantName: '',
    email: '',
    phone: '',
    address: '',
    fullName: '',
    role: '',
    teamSize: ''
  });

  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Phone number formatting function
  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Limit to 10 digits for US/Canada numbers
    const limited = numbers.slice(0, 10);
    
    // Format based on length
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
    if (numbers.length === 0) return true; // Optional field
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

  // Load from ALL sources on mount
  useEffect(() => {
    console.log('📊 RestaurantInfoStep received data:', data);
    
    let mergedData: any = {};
    
    // 1. Load from drift-user-profile first (from signup - MOST IMPORTANT)
    const userProfile = localStorage.getItem('drift-user-profile');
    if (userProfile) {
      try {
        const profile = JSON.parse(userProfile);
        console.log('👤 Loaded user profile:', profile);
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
        console.log('📂 Loaded onboarding:', parsed);
        mergedData = { ...mergedData, ...parsed };
      } catch (e) {
        console.error('Error parsing onboarding:', e);
      }
    }
    
    // 3. Props override everything (most recent)
    if (data) {
      mergedData = { ...mergedData, ...data };
    }
    
    console.log('✅ Final merged data:', mergedData);
    
    // Format phone number if it exists (remove any existing formatting and reapply)
    let phoneNumber = mergedData.phone || '';
    if (phoneNumber) {
      // Remove any existing formatting and reapply our standard format
      const numbers = phoneNumber.replace(/\D/g, '');
      if (numbers.length > 0) {
        phoneNumber = formatPhoneNumber(numbers);
      }
    }
    
    // Set ALL form fields with merged data
    setFormData({
      restaurantName: mergedData.restaurantName || mergedData.businessName || mergedData.name || '',
      email: mergedData.email || '',
      phone: phoneNumber,
      address: mergedData.address || '',
      fullName: mergedData.fullName || '',
      role: mergedData.role || '',
      teamSize: mergedData.teamSize || ''
    });
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone before submit
    if (formData.phone && !validatePhone(formData.phone)) {
      return;
    }
    
    // Save to parent and localStorage
    const dataToSave = {
      name: formData.restaurantName,
      email: formData.email,
      phone: formData.phone, // Store formatted version
      address: formData.address,
      fullName: formData.fullName,
      role: formData.role,
      teamSize: formData.teamSize
    };
    
    console.log('💾 Saving restaurant info:', dataToSave);
    
    // Update parent
    updateData(dataToSave);
    
    // Update onboarding progress
    const onboarding = JSON.parse(localStorage.getItem('drift_onboarding') || '{}');
    localStorage.setItem('drift_onboarding', JSON.stringify({
      ...onboarding,
      ...dataToSave
    }));
    
    // Update user profile
    const profile = JSON.parse(localStorage.getItem('drift-user-profile') || '{}');
    localStorage.setItem('drift-user-profile', JSON.stringify({
      ...profile,
      ...dataToSave
    }));
    
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-light mb-2">Restaurant Information</h2>
        <p className="text-gray-400">Tell us about your restaurant</p>
      </div>

      {/* User info summary from signup - Shows what was passed */}
      {(formData.fullName || formData.role || formData.teamSize) && (
        <Card className="mb-6 p-4 bg-blue-50 border-blue-100">
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

      <Card padding="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.restaurantName}
              onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g., Joe's Pizza"
            />
            {formData.restaurantName && (
              <p className="text-xs text-green-600 mt-1">✓ Pre-filled from signup</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="contact@joespizza.com"
            />
            {formData.email && (
              <p className="text-xs text-green-600 mt-1">✓ Pre-filled from signup</p>
            )}
          </div>

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
                maxLength={14} // (123) 456-7890 is 14 characters
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                  phoneError 
                    ? 'border-red-300 bg-red-50' 
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
            {formData.phone && !phoneError && (
              <p className="text-xs text-green-600 mt-1">✓ Format looks good</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Enter 10-digit US/Canada number
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="123 Main St, New York, NY 10001"
            />
          </div>

          {/* Hidden fields to preserve signup data */}
          <input type="hidden" name="fullName" value={formData.fullName} />
          <input type="hidden" name="role" value={formData.role} />
          <input type="hidden" name="teamSize" value={formData.teamSize} />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onPrev} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!!phoneError}
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Card>

      {/* Debug info - remove in production */}
      {import.meta.env.DEV && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <p className="font-mono">Debug: {JSON.stringify(formData, null, 2)}</p>
        </div>
      )}
    </motion.div>
  );
}