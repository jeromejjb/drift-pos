import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'text';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
}

const variantStyles = {
  primary: 'bg-black text-white hover:bg-gray-800',
  secondary: 'bg-white border border-gray-200 text-black hover:border-black',
  text: 'text-gray-400 hover:text-black bg-transparent',
};

const sizeStyles = {
  sm: 'py-2 px-4 text-sm',
  md: 'py-3 px-6 text-base',
  lg: 'py-4 px-6 text-base',
};

export function Button({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  size = 'md',
  icon,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        ${fullWidth ? 'w-full' : ''}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        rounded-xl font-medium transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}