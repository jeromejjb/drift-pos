import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

const paddingStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
};

export function Card({ children, className = '', padding = 'md', onClick }: CardProps) {
  return (
    <div 
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${paddingStyles[padding]} ${className} ${onClick ? 'cursor-pointer hover:border-black transition-colors' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}