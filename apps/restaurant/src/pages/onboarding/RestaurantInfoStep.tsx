import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface RestaurantInfoStepProps {
  restaurantId: string;
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function RestaurantInfoStep({ restaurantId, data, updateData, onNext }: RestaurantInfoStepProps) {
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(data.restaurantInfo || {
    name: '',
    address: '',
    phone: '',
    cuisine: ''
  });

  useEffect(() => {
    fetchRestaurant();
  }, [restaurantId]);

  const fetchRestaurant = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/restaurants/${restaurantId}`);
      if (response.ok) {
        const data = await response.json();
        setInfo({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          cuisine: data.cuisine || ''
        });
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info)
      });

      if (response.ok) {
        updateData({ restaurantInfo: info });
        onNext();
      }
    } catch (error) {
      console.error('Error saving restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light text-gray-900 mb-2">Restaurant Information</h2>
        <p className="text-gray-400">Tell us about your restaurant</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant name</label>
          <input
            type="text"
            value={info.name}
            onChange={(e) => setInfo({ ...info, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Trattoria Bellini"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <input
            type="text"
            value={info.address}
            onChange={(e) => setInfo({ ...info, address: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="123 Main St, New York, NY"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={info.phone}
            onChange={(e) => setInfo({ ...info, phone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine type</label>
          <select
            value={info.cuisine}
            onChange={(e) => setInfo({ ...info, cuisine: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Select cuisine</option>
            <option value="italian">Italian</option>
            <option value="american">American</option>
            <option value="mexican">Mexican</option>
            <option value="chinese">Chinese</option>
            <option value="japanese">Japanese</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button
          onClick={handleSubmit}
          disabled={loading || !info.name}
          className="px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? 'Saving...' : 'Continue'}
          <CheckCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}