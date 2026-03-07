import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** Redirect /settings → /me. Taproom uses NEXT_PUBLIC_DRIFT_SETTINGS_URL (default: {DRIFT_PAY_URL base}/settings) for payment method setup. */
export function SettingsRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/me', { replace: true });
  }, [navigate]);
  return (
    <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--drift-ink)] border-t-transparent" />
    </div>
  );
}
