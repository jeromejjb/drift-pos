import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Apple, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';

export function PaymentPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [tipPercent, setTipPercent] = useState(18);
  const [processing, setProcessing] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState('');
  const [loading, setLoading] = useState(true);

  // Load cart data when component mounts
  useEffect(() => {
    const savedCart = localStorage.getItem('drift-cart');
    const savedRestaurant = localStorage.getItem('drift-restaurant');
    
    console.log('📦 PaymentPage - URL params:', { tableId });
    console.log('📦 PaymentPage - Loading from localStorage:', {
      cart: savedCart,
      restaurant: savedRestaurant
    });
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
        console.log('✅ Cart loaded:', parsedCart);
      } catch (error) {
        console.error('❌ Failed to parse cart:', error);
      }
    }
    
    if (savedRestaurant) {
      setRestaurantId(savedRestaurant);
      console.log('✅ Restaurant ID loaded:', savedRestaurant);
    }
    
    setLoading(false);
  }, [tableId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1;
  const tip = (subtotal * tipPercent) / 100;
  const total = subtotal + tax + tip;

    // In handlePayment function, prefix unused parameter
const handlePayment = async (_method: string) => {
  setProcessing(true);
    
    try {
      // Validate all required fields
      console.log('🔍 Payment validation:', {
        restaurantId,
        tableId,
        cartItems,
        total,
        tip
      });

      if (!tableId) {
        throw new Error('Table ID is missing from URL. Please go back to the menu.');
      }

      if (!restaurantId) {
        throw new Error('Restaurant ID is missing. Please go back to the menu.');
      }

      if (!cartItems.length) {
        throw new Error('Your cart is empty.');
      }

      // Create the order in your API
      const orderResponse = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurantId,
          tableId: tableId,
          userId: 'test-user-123',
          items: cartItems.map(item => ({
            menuItemId: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          total: total,
          tip: tip
        })
      });

      // Get response text for debugging
      const responseText = await orderResponse.text();
      console.log('📡 API Response:', {
        status: orderResponse.status,
        body: responseText
      });
      
      if (!orderResponse.ok) {
        throw new Error(`Failed to create order: ${responseText}`);
      }
      
      const orderData = JSON.parse(responseText);
      console.log('✅ Order created:', orderData);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Clear cart
      localStorage.removeItem('drift-cart');
      localStorage.removeItem('drift-restaurant');
      
      // Navigate to confirmation
      navigate(`/confirmation/${orderData.id}`);
      
    } catch (error) {
      console.error('❌ Payment failed:', error);
      setProcessing(false);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs text-gray-400">drift</div>
            <div className="font-medium">Payment</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Order summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-medium mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            {cartItems.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 my-2 pt-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tip selection */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">Add Tip</h3>
          <div className="flex gap-2">
            {[15, 18, 20, 25].map(percent => (
              <button
                key={percent}
                onClick={() => setTipPercent(percent)}
                className={`flex-1 py-3 rounded-xl border transition-colors ${
                  tipPercent === percent
                    ? 'bg-black text-white border-black'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="bg-black text-white rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Total</span>
            <span className="text-2xl font-light">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment methods */}
        <div className="space-y-3">
          <button
            onClick={() => handlePayment('apple')}
            disabled={processing}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Apple className="w-5 h-5" />
            {processing ? 'Processing...' : 'Pay with Apple Pay'}
          </button>

          <button
            onClick={() => handlePayment('card')}
            disabled={processing}
            className="w-full bg-white hover:bg-gray-50 text-black font-medium py-4 px-6 rounded-xl border border-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CreditCard className="w-5 h-5" />
            {processing ? 'Processing...' : 'Pay with Card'}
          </button>
        </div>
      </div>
    </div>
  );
}