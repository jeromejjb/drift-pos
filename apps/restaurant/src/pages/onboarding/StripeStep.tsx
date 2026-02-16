import { useState } from 'react';
import { Button } from './../../components/ui/Button';
import { Card } from './../../components/ui/Card';

export function StripeStep({ data, onComplete }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      
      if (!API_URL) {
        throw new Error('API_URL not configured');
      }

      console.log('📡 Connecting to:', `${API_URL}/api/stripe/connect`);
      
      const res = await fetch(`${API_URL}/api/stripe/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          restaurantId: data.restaurantId
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      
      const { url, accountId } = await res.json();
      
      // Save the Stripe account ID
      await fetch(`${API_URL}/api/restaurant/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          restaurantId: data.restaurantId,
          stripeAccountId: accountId 
        })
      });
      
      // Redirect to Stripe to add bank details
      window.location.href = url;
      
    } catch (error) {
      console.error('❌ Connection error:', error);
      alert(`Failed to connect: ${error.message}. Please check console for details.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl mb-4">Get Paid</h2>
      <Card className="p-6">
        <p className="mb-4">
          Connect your bank account to receive payments instantly.
          <br />
          <span className="text-sm text-gray-400">
            {data.tier === 'pro' ? '2.5%' : '3.5%'} transaction fee
          </span>
        </p>
        
        <Button 
          onClick={handleConnect}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Connecting...' : 'Connect Bank Account'}
        </Button>
        
        <button 
          onClick={onComplete}
          className="text-sm text-gray-400 mt-3 w-full"
        >
          Skip for now
        </button>
      </Card>
    </div>
  );
}