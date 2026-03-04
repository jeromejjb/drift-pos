import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[13px] font-medium text-[var(--drift-ink-muted)]">
          {label}
        </label>
      )}
      <input
        className={`
          w-full min-h-[44px] px-4 py-3 rounded-[var(--drift-radius-lg)] border
          bg-[var(--drift-surface)] text-[var(--drift-ink)] text-[16px]
          placeholder:text-[var(--drift-ink-subtle)]
          focus:outline-none focus:ring-2 focus:ring-[var(--drift-accent)]/25 focus:border-[var(--drift-accent)]
          transition-all duration-[var(--drift-duration)] ease-[var(--drift-ease)]
          disabled:opacity-60 disabled:cursor-not-allowed
          ${error ? 'border-[var(--drift-error-text)]' : 'border-[var(--drift-border)]'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-[var(--drift-error-text)]">{error}</p>
      )}
    </div>
  );
}
