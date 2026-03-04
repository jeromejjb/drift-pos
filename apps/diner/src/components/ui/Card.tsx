import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

const paddingStyles = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-8',
};

export function Card({
  children,
  title,
  className = '',
  padding = 'md',
  onClick,
}: CardProps) {
  return (
    <div
      className={`
        bg-[var(--drift-surface)] rounded-[var(--drift-radius-xl)] border border-[var(--drift-border)]
        shadow-[var(--drift-shadow-sm)]
        ${paddingStyles[padding]} ${className}
        ${onClick ? 'cursor-pointer hover:bg-[var(--drift-surface-overlay)] hover:shadow-[var(--drift-shadow)] transition-all duration-[var(--drift-duration)]' : ''}
      `}
      onClick={onClick}
    >
      {title && (
        <h3 className="text-base font-medium text-[var(--drift-ink)] mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
