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
    cuisine: ''
  });

  // Use environment variables
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const APP_URL = import.meta.env.VITE_APP_URL || 'https://drift-restaurant.onrender.com';
  // Get JWT token from localStorage (saved during signup/login)
  const getToken = () => {
    const token = localStorage.getItem('drift-token');
    if (!token) {
      console.error('No token found - user may need to login again');
      // Redirect to login if no token
      window.location.href = `${APP_URL}/login`;
      return null;
    }
    return token;
  };

  useEffect(() => {
    fetchRestaurant();
  }, [restaurantId]);

  const fetchRestaurant = async () => {
    try {
      const token = getToken();
      if (!token) return;

      console.log('Fetching restaurant with token:', token.substring(0, 20) + '...');
      
      const response = await fetch(`${API_URL}/api/restaurants/${restaurantId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        console.error('Unauthorized - token may be expired');
        // Token expired - redirect to login
        localStorage.removeItem('drift-token');
        window.location.href = `${APP_URL}/login`;
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Restaurant data loaded:', data);
        setInfo({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          cuisine: data.cuisine || ''
        });
      } else {
        console.error('Failed to fetch restaurant:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      setError('Failed to load restaurant data');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = getToken();
      if (!token) {
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }

      console.log('Saving restaurant data with token:', token.substring(0, 20) + '...');
      
      const response = await fetch(`${API_URL}/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(info)
      });

      if (response.status === 401) {
        console.error('Unauthorized - token may be expired');
        localStorage.removeItem('drift-token');
        window.location.href = `${APP_URL}/login`;
        return;
      }

      if (response.ok) {
        console.log('Restaurant saved successfully');
        updateData({ restaurantInfo: info });
        onNext();
      } else {
        const errorText = await response.text();
        console.error('Failed to save restaurant:', errorText);
        setError('Failed to save restaurant information');
      }
    } catch (error) {
      console.error('Error saving restaurant:', error);
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