// apps/restaurant/src/config/tabs.ts
import { type IconName } from '../components/ui/icons';

export interface TabConfig {
  id: string;
  label: string;
  icon: IconName;
  path: string;
  description?: string;
  badge?: {
    show: boolean;
    color?: 'red' | 'green' | 'blue' | 'yellow';
    value?: number | string;
  };
}

export const mainTabs: TabConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'Home',
    path: '/dashboard',
    description: 'Overview of your restaurant',
    badge: {
      show: true,
      color: 'blue',
      value: 'new'
    }
  },
  {
    id: 'tables',
    label: 'Tables',
    icon: 'Grid',
    path: '/tables',
    description: 'Manage your tables and QR codes'
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: 'List',
    path: '/orders',
    description: 'View and manage orders',
    badge: {
      show: true,
      color: 'red',
      value: 3
    }
  },
  {
    id: 'menu',
    label: 'Menu',
    icon: 'Utensils',
    path: '/menu',
    description: 'Edit your menu items'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    path: '/settings',
    description: 'Restaurant settings'
  }
];

export const foodCategories = [
  { id: 'pizza', label: 'Pizza', icon: 'Pizza' },
  { id: 'pasta', label: 'Pasta', icon: 'Utensils' },
  { id: 'seafood', label: 'Seafood', icon: 'Fish' },
  { id: 'salads', label: 'Salads', icon: 'Salad' },
  { id: 'desserts', label: 'Desserts', icon: 'Cake' },
  { id: 'beverages', label: 'Beverages', icon: 'Wine' },
  { id: 'coffee', label: 'Coffee', icon: 'Coffee' },
  { id: 'beer', label: 'Beer', icon: 'Beer' },
];

export const statusConfig = {
  pending: { icon: 'Clock', color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
  preparing: { icon: 'Coffee', color: 'text-blue-600', bg: 'bg-blue-50', label: 'Preparing' },
  ready: { icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50', label: 'Ready' },
  served: { icon: 'Check', color: 'text-gray-600', bg: 'bg-gray-50', label: 'Served' },
  completed: { icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50', label: 'Completed' },
  cancelled: { icon: 'X', color: 'text-red-600', bg: 'bg-red-50', label: 'Cancelled' },
};