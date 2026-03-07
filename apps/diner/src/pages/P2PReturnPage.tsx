import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function P2PReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return_to');

  useEffect(() => {
    if (returnTo && returnTo.startsWith('http')) {
      window.location.href = returnTo;
      return;
    }
    navigate('/pay', { replace: true });
  }, [navigate, returnTo]);

  return (
    <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--drift-ink)] border-t-transparent" />
    </div>
  );
}
