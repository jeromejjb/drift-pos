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
  const [error, setError] = useState('');
  const [info, setInfo] = useState(data.restaurantInfo || {
    name: '',
    address: '',
    phone: '',
    cuisine: '',
    email: ''
  });

  // Use environment variables
  const API_URL = import.meta.env.VITE_API_URL || 'https://drift-api-7vs7.onrender.com';

  // ========== ELITE DEBUG LOGGING ==========
  console.log('🎯 ===== RESTAURANT INFO STEP MOUNTED =====');
  console.log('📌 restaurantId prop:', restaurantId);
  console.log('🔧 API_URL being used:', API_URL);
  console.log('🔑 Token exists:', !!localStorage.getItem('drift-token'));
  console.log('📦 Initial info state (from signup):', info);
  console.log('=======================================');

  useEffect(() => {
    console.log('🔄 useEffect triggered for restaurantId:', restaurantId);
    fetchRestaurant();
  }, [restaurantId]);

  const fetchRestaurant = async () => {
    console.log('🔍 fetchRestaurant called with ID:', restaurantId);
    console.log('🌐 Fetching from:', `${API_URL}/api/restaurants/${restaurantId}`);
    
    try {
      const response = await fetch(`${API_URL}/api/restaurants/${restaurantId}`);
      
      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Restaurant data received:', data);
        setInfo(prev => ({
          name: data.name || prev.name || '',
          address: data.address || '',
          phone: data.phone || '',
          cuisine: data.cuisine || '',
          email: data.email || prev.email || ''
        }));
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch restaurant. Status:', response.status);
        setError(`Failed to load restaurant data (${response.status})`);
      }
    } catch (error) {
      console.error('💥 Network/Fetch error:', error);
      setError('Failed to load restaurant data. Network error.');
    }
  };

  const handleSubmit = async () => {
    console.log('📤 handleSubmit with data:', info);
    setLoading(true);
    setError('');
    
    try {
      // Get the token from localStorage (saved during signup)
      const token = localStorage.getItem('drift-token');
      console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'No token found');
      
      const response = await fetch(`${API_URL}/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(info)
      });

      console.log('📡 PATCH response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Restaurant saved successfully:', responseData);
        updateData({ restaurantInfo: info });
        onNext();
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to save restaurant:', errorText);
        setError('Failed to save restaurant information');
      }
    } catch (error) {
      console.error('💥 Error saving:', error);
      setError('Network error. Please try again.');
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

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

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
          <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
          <input
            type="email"
            value={info.email}
            onChange={(e) => setInfo({ ...info, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="owner@restaurant.com"
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
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              Continue
              <CheckCircle className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}