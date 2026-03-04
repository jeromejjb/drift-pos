import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.driftpos.com';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: 'owner' | 'staff' | 'admin';
  restaurantId: string;
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'trialing' | 'past_due' | 'cancelled';
    features: string[];
  };
}

/** Fetch user from JWT (drift-token) via /api/auth/verify */
async function fetchUserFromJWT(): Promise<User | null> {
  const token = localStorage.getItem('drift-token');
  if (!token) return null;

  const response = await fetch(`${API_URL}/api/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;

  const { user: u, restaurant: r } = await response.json();
  if (!u || !r) return null;

  return {
    id: u.id,
    name: u.name || 'User',
    email: u.email || '',
    phone: u.phone,
    role: 'owner' as const,
    restaurantId: r.id,
    subscription: { plan: 'free' as const, status: 'active' as const, features: [] },
  };
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Prefer JWT (drift-token) - used by landing login/signup flow
        const jwtUser = await fetchUserFromJWT();
        if (jwtUser) {
          setUser(jwtUser);
          setLoading(false);
          return;
        }

        // Fallback: Supabase auth (if configured)
        if (supabase) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const response = await fetch(`${API_URL}/api/users/${authUser.id}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('drift-token') || '' }` },
            });
            if (response.ok) {
              const userData = await response.json();
              setUser(userData);
            }
          }
        }

        setUser(null);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Listen for Supabase auth changes (if configured)
    const authListener = supabase?.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        fetchUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener?.data?.subscription?.unsubscribe();
    };
  }, []);

  return { user, loading, error };
}