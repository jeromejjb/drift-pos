import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled' | 'available' | 'occupied' | 'reserved';
  className?: string;
}

const variantStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  preparing: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  served: 'bg-gray-100 text-gray-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  available: 'bg-green-100 text-green-700',
  occupied: 'bg-blue-100 text-blue-700',
  reserved: 'bg-purple-100 text-purple-700',
};

export function Badge({ children, variant = 'pending', className = '' }: BadgeProps) {
  const style = variantStyles[variant] ?? variantStyles.pending;
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${style} ${className}`}>
      {children}
    </span>
  );
}