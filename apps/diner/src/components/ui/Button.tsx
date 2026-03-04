import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'text';
  fullWidth?: boolean;
  className?: string;
  icon?: ReactNode;
}

const variantStyles = {
  primary:
    'bg-[var(--drift-accent)] text-white hover:bg-[var(--drift-accent-hover)] active:scale-[0.98] shadow-[var(--drift-shadow-sm)]',
  secondary:
    'bg-[var(--drift-surface)] border border-[var(--drift-border)] text-[var(--drift-ink)] hover:bg-[var(--drift-surface-overlay)] hover:border-[var(--drift-border-strong)]',
  text:
    'bg-transparent text-[var(--drift-ink-muted)] hover:text-[var(--drift-ink)]',
};

export function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  className = '',
  icon,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      {...props}
      className={`
        ${fullWidth ? 'w-full' : ''}
        ${variantStyles[variant]}
        min-h-[44px] py-3 px-6 rounded-[var(--drift-radius-pill)] font-semibold text-[15px]
        transition-all duration-[var(--drift-duration)] ease-[var(--drift-ease)]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
