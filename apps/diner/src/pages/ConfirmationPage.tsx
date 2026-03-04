import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, QrCode } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function ConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex flex-col items-center justify-center px-5">
      <div className="max-w-md w-full text-center animate-scale-in">
        <div className="w-24 h-24 rounded-full bg-[var(--drift-accent-muted)] flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-[var(--drift-accent)]" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--drift-ink)] mb-2">Order confirmed</h1>
        <p className="text-[var(--drift-ink-muted)] text-sm mb-8">
          Your order #{orderId?.slice(-6)} has been sent to the kitchen.
        </p>

        <div className="bg-[var(--drift-surface)] border border-[var(--drift-border)] rounded-[var(--drift-radius-xl)] p-6 mb-8 text-left shadow-[var(--drift-shadow-sm)]">
          <p className="text-sm text-[var(--drift-ink-muted)] mb-1">Estimated wait</p>
          <p className="text-2xl font-semibold text-[var(--drift-ink)]">15–20 min</p>
        </div>

        <Button
          fullWidth
          onClick={() => navigate('/')}
          icon={<QrCode className="w-4 h-4" />}
        >
          Back to Dine
        </Button>
        <p className="mt-6 text-sm text-[var(--drift-ink-subtle)]">
          <button
            type="button"
            onClick={() => navigate('/signin?return=/pay')}
            className="underline hover:text-[var(--drift-ink-muted)] transition-colors"
          >
            Sign in to save receipts
          </button>
        </p>
      </div>
    </div>
  );
}
