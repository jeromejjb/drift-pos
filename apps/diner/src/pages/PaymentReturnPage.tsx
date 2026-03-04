import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function PaymentReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('redirect_status');
    const orderId = localStorage.getItem('drift-pending-order');
    localStorage.removeItem('drift-cart');
    localStorage.removeItem('drift-restaurant');
    localStorage.removeItem('drift-pending-order');
    if (status === 'succeeded' && orderId) {
      navigate(`/confirmation/${orderId}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--drift-ink)] border-t-transparent" />
    </div>
  );
}
