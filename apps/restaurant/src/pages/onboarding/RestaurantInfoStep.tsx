import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Mail, Phone, MapPin, ChevronRight, ChevronLeft, User, Briefcase, Users } from 'lucide-react';
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

  // Load from localStorage AND props on mount
  useEffect(() => {
    console.log('📊 RestaurantInfoStep received data:', data);
    
    let mergedData: any = {};
    
    // 1. Load from drift-user-profile first (from signup)
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
    
    setFormData({
      restaurantName: mergedData.restaurantName || mergedData.businessName || mergedData.name || '',
      email: mergedData.email || '',
      phone: mergedData.phone || '',
      address: mergedData.address || '',
      fullName: mergedData.fullName || '',
      role: mergedData.role || '',
      teamSize: mergedData.teamSize || ''
    });
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to parent and localStorage
    const dataToSave = {
      name: formData.restaurantName,
      email: formData.email,
      phone: formData.phone,
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

      {/* User info summary from signup - NOW VISIBLE */}
      {(formData.fullName || formData.role || formData.teamSize) && (
        <Card className="mb-6 p-4 bg-blue-50 border-blue-100">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {formData.fullName && (
              <span className="flex items-center gap-1 text-blue-800">
                <User className="w-4 h-4 text-blue-600" />
                {formData.fullName}
              </span>
            )}
            {formData.role && (
              <span className="flex items-center gap-1 text-blue-800">
                <Briefcase className="w-4 h-4 text-blue-600" />
                {formData.role}
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="(555) 123-4567"
            />
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

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onPrev} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button type="submit" className="flex-1">
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}