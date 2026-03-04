import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function P2PReturnPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/pay', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--drift-ink)] border-t-transparent" />
    </div>
  );
}
