import { useState, useEffect } from 'react';

interface Subscription {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'cancelled';
  features: string[];
  expiresAt?: Date;
}

export function useSubscription(userId?: string) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setSubscription(null);
      return;
    }

    const fetchSubscription = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}/subscription`);
        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
        } else {
          // Default to free plan if no subscription
          setSubscription({
            plan: 'free',
            status: 'active',
            features: ['basic_ordering', 'qr_codes']
          });
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        // Fallback to free plan
        setSubscription({
          plan: 'free',
          status: 'active',
          features: ['basic_ordering', 'qr_codes']
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [userId]);

  return { subscription, loading };
}