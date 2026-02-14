import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;  // Add optional title prop
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

export function Card({ children, title, className = '', padding = 'md', onClick }: CardProps) {
  return (
    <div 
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${paddingStyles[padding]} ${className} ${onClick ? 'cursor-pointer hover:border-black transition-colors' : ''}`}
      onClick={onClick}
    >
      {title && <h3 className="text-lg font-medium mb-4">{title}</h3>}
      {children}
    </div>
  );
}