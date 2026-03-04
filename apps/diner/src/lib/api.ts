export const API_URL = import.meta.env.VITE_API_URL || 'https://api.driftpos.com';

// Only ever use the publishable key (pk_*) in the browser. Never use the secret key (sk_*).
const rawStripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
export const STRIPE_PUBLISHABLE_KEY =
  rawStripeKey.startsWith('pk_') ? rawStripeKey : '';
/** True when using Stripe test keys — no real charges; use test card 4242 4242 4242 4242 */
export const isStripeTestMode = rawStripeKey.startsWith('pk_test_');

export type { Restaurant, Table, MenuItem, Category, CartItem } from '../types';

export async function getRestaurantByTableId(tableId: string): Promise<import('../types').Restaurant> {
  const response = await fetch(`${API_URL}/api/table/${tableId}/restaurant`);
  if (!response.ok) throw new Error('Failed to fetch restaurant');
  return response.json();
}

export async function getMenuByRestaurantId(restaurantId: string): Promise<import('../types').Category[]> {
  const response = await fetch(`${API_URL}/api/restaurant/${restaurantId}/menu`);
  if (!response.ok) {
    throw new Error('Failed to fetch menu');
  }
  return response.json();
}