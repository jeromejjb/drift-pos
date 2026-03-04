import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { AuthForm } from './AuthForm';

interface AuthGateProps {
  /** Short reason shown in the modal (e.g. "to send money") */
  reason?: string;
  onSuccess: () => void;
  onDismiss: () => void;
}

const AUTH_UNAVAILABLE = "Sign-in isn't available right now. Please try again later.";

/**
 * Cash App–style auth gate: modal sign-in/sign-up so users stay in context.
 * Use when gating Pay (send), Money (activity), or Me (profile).
 */
export function AuthGate({ reason = 'to continue', onSuccess, onDismiss }: AuthGateProps) {
  const { isAuthConfigured } = useAuth();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-gate-title"
    >
      <div
        className="absolute inset-0 bg-[var(--drift-ink)]/50 backdrop-blur-md"
        onClick={onDismiss}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-md bg-[var(--drift-surface)] rounded-t-[var(--drift-radius-2xl)] sm:rounded-[var(--drift-radius-2xl)] shadow-[var(--drift-shadow-lg)] animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[var(--drift-surface)] border-b border-[var(--drift-border)] px-5 py-4 flex items-center justify-between rounded-t-[var(--drift-radius-2xl)]">
          <h2 id="auth-gate-title" className="text-lg font-semibold text-[var(--drift-ink)]">
            {isAuthConfigured ? `Sign in ${reason}` : 'Sign-in unavailable'}
          </h2>
          <button
            type="button"
            onClick={onDismiss}
            className="p-2.5 -mr-2.5 rounded-[var(--drift-radius)] text-[var(--drift-ink-muted)] hover:bg-[var(--drift-surface-overlay)] hover:text-[var(--drift-ink)] transition-colors duration-[var(--drift-duration)]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 pb-10 safe-bottom">
          {!isAuthConfigured ? (
            <>
              <p className="text-sm text-[var(--drift-ink-muted)] mb-6">{AUTH_UNAVAILABLE}</p>
              <Button fullWidth onClick={onDismiss}>OK</Button>
            </>
          ) : (
            <AuthForm onSuccess={onSuccess} />
          )}
        </div>
      </div>
    </div>
  );
}
