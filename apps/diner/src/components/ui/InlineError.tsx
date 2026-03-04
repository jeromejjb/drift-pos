import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  /** Optional action (e.g. "Try again" button) */
  action?: ReactNode;
  className?: string;
}

/**
 * User-friendly error block. Never shows technical details.
 * Use for payment, auth, and API errors.
 */
export function InlineError({ message, onRetry, action, className = '' }: InlineErrorProps) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-[var(--drift-radius-lg)] bg-[var(--drift-error-bg)] border border-[var(--drift-error-text)]/20 text-[var(--drift-error-text)] text-[15px] leading-relaxed ${className}`}
    >
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[var(--drift-error-text)]/70" />
      <div className="min-w-0 flex-1">
        <p>{message}</p>
        {(action || onRetry) && (
          <div className="mt-3">
            {action ?? (onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="text-sm font-medium text-[var(--drift-accent)] hover:underline underline-offset-2"
              >
                Try again
              </button>
            ) : null)}
          </div>
        )}
      </div>
    </div>
  );
}
