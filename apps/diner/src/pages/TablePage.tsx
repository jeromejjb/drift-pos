import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getRestaurantByTableId, type Restaurant } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function TablePage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRestaurant = async () => {
      if (!tableId) return;
      try {
        setLoading(true);
        const data = await getRestaurantByTableId(tableId);
        setRestaurant(data);
      } catch (err) {
        setError('Could not find this table');
      } finally {
        setLoading(false);
      }
    };
    loadRestaurant();
  }, [tableId]);

  const currentTable = restaurant?.tables.find(t => t.id === tableId);
  const tableNumber = currentTable?.number || '?';

  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(() => navigate(`/menu/${tableId}`), 400);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Finding your table...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card padding="lg" className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😕</span>
          </div>
          <h2 className="text-xl font-medium mb-2">Table not found</h2>
          <p className="text-gray-400 text-sm mb-6">The QR code might be invalid</p>
          <Button onClick={() => navigate('/')} fullWidth>
            Scan Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Back button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-4 p-3 text-gray-400 hover:text-black active:bg-gray-50 rounded-full transition-all z-10"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="container max-w-md mx-auto px-4 pt-16 pb-8">
        
        {/* Restaurant name */}
        <div className="text-center mb-8 animate-fade-in">
          <p className="text-xs text-gray-300 tracking-widest mb-2">WELCOME TO</p>
          <h1 className="text-3xl font-light">{restaurant.name}</h1>
        </div>

        {/* Table card - Hero element */}
        <div className="relative mb-8 animate-slide-up">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white rounded-3xl -rotate-1 scale-95 opacity-50"></div>
          
          <Card padding="xl" className="relative text-center">
            <p className="text-sm text-gray-400 mb-2">You're at</p>
            
            {/* Animated number */}
            <div className="relative">
              <span className="text-9xl font-light block leading-none animate-pop">
                {tableNumber}
              </span>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            
            <p className="text-gray-300 mt-2">Table {tableNumber}</p>

            {/* Decorative dots */}
            <div className="flex justify-center gap-2 mt-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-gray-200 rounded-full"></div>
              ))}
            </div>
          </Card>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 animate-slide-up">
          <Button 
            onClick={handleConfirm} 
            fullWidth 
            disabled={confirming}
            className="shadow-lg"
          >
            {confirming ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Just a moment...</span>
              </div>
            ) : (
              <span className="flex items-center gap-2">
                That's me
                <Check className="w-4 h-4" />
              </span>
            )}
          </Button>

          <button 
            onClick={() => navigate('/')}
            className="w-full text-center text-gray-400 py-3 text-sm active:text-black transition-colors"
          >
            Not my table
          </button>
        </div>

        {/* Trust badge */}
        <p className="text-center text-xs text-gray-300 mt-8">
          🔒 Your payment is secure with Drift
        </p>
      </div>
    </div>
  );
}