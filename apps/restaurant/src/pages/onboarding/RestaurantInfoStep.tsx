import { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, MapPin, Phone, Clock, Globe, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

interface Props {
  restaurantId: string | null;
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function RestaurantInfoStep({ restaurantId, data, updateData, onNext }: Props) {
  const [formData, setFormData] = useState({
    name: data?.name || '',
    address: data?.address || '',
    phone: data?.phone || '',
    cuisine: data?.cuisine || '',
    website: data?.website || '',
    hours: data?.hours || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Restaurant name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.cuisine.trim()) newErrors.cuisine = 'Cuisine type is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      updateData({ restaurantInfo: formData });
      onNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-light mb-2">Tell us about your restaurant</h2>
        <p className="text-gray-400">This helps us personalize your experience</p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Restaurant Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Trattoria Bellini"
            icon={<Store className="w-4 h-4" />}
            error={errors.name}
            required
          />

          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="123 Main St, New York, NY"
            icon={<MapPin className="w-4 h-4" />}
            error={errors.address}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(212) 555-0123"
              icon={<Phone className="w-4 h-4" />}
              error={errors.phone}
              required
            />

            <Input
              label="Cuisine Type"
              value={formData.cuisine}
              onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
              placeholder="Italian, Pizza, etc."
              icon={<Globe className="w-4 h-4" />}
              error={errors.cuisine}
              required
            />
          </div>

          <Input
            label="Website (optional)"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://www.trattoriabellini.com"
            icon={<Globe className="w-4 h-4" />}
          />

          <Input
            label="Hours (optional)"
            value={formData.hours}
            onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
            placeholder="Mon-Fri: 11am-10pm, Sat-Sun: 10am-11pm"
            icon={<Clock className="w-4 h-4" />}
          />

          <div className="pt-4">
            <Button type="submit" size="lg" fullWidth>
              Continue to Table Setup
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Card>

      {/* Tip Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl">
        <p className="text-sm text-blue-700">
          <span className="font-medium">💡 Tip:</span> You can always update this information later in your settings.
        </p>
      </div>
    </motion.div>
  );
}