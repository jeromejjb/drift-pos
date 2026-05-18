import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAddCard } from '../contexts/AddCardContext';
import { User, LogOut, QrCode, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthGate } from '../components/auth/AuthGate';
import { Button } from '../components/ui/Button';
import { PageShell } from '../components/layout/PageShell';

export function MePage() {
  const navigate = useNavigate();
  const { openAddCard } = useAddCard();
  const { user, signOut, loading } = useAuth();
  const [showAuthGate, setShowAuthGate] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--drift-surface-elevated)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--drift-ink)] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <PageShell withNav>
        <header className="px-5 pt-8 pb-6 border-b border-[var(--drift-border)] bg-[var(--drift-surface-elevated)]">
          <h1 className="text-2xl font-semibold text-[var(--drift-ink)] tracking-tight">Me</h1>
        </header>
        <div className="px-5 py-16 max-w-md mx-auto text-center">
          <div className="w-20 h-20 rounded-2xl bg-[var(--drift-accent)]/15 flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-[var(--drift-accent)]" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-semibold text-[var(--drift-ink)]">Your profile</h2>
          <p className="text-[var(--drift-ink-muted)] text-[15px] mt-2 max-w-xs mx-auto">
            Sign in to pay at tables, save a card, and manage your account.
          </p>
          <Button className="mt-8 min-w-[200px]" onClick={() => setShowAuthGate(true)}>
            Sign in or create account
          </Button>
        </div>
        {showAuthGate && (
          <AuthGate reason="to see your profile" defaultSignUp onSuccess={() => setShowAuthGate(false)} onDismiss={() => setShowAuthGate(false)} />
        )}
      </PageShell>
    );
  }

  const navRowClass =
    'w-full flex items-center gap-3 px-4 py-3.5 rounded-[var(--drift-radius-xl)] hover:bg-[var(--drift-surface-overlay)] active:scale-[0.99] transition-all duration-[var(--drift-duration)] text-left';

  return (
    <PageShell>
      <header className="px-5 pt-6 pb-4 border-b border-[var(--drift-border)] bg-[var(--drift-surface-elevated)]">
        <h1 className="text-2xl font-semibold text-[var(--drift-ink)] tracking-tight">Me</h1>
        <p className="text-[var(--drift-ink-muted)] text-sm mt-1">Profile and settings</p>
      </header>

      <div className="px-5 py-6 max-w-md mx-auto">
        <div className="flex items-center gap-4 p-5 rounded-[var(--drift-radius-xl)] bg-[var(--drift-surface)] border border-[var(--drift-border)] shadow-[var(--drift-shadow-sm)] animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-[var(--drift-accent)] flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-[var(--drift-shadow)] ring-2 ring-[var(--drift-accent)]/20">
            {(user.email?.[0] || user.user_metadata?.name?.[0] || 'U').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[var(--drift-ink)] truncate text-[17px]">
              {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-sm text-[var(--drift-ink-muted)] truncate mt-0.5">{user.email}</p>
          </div>
        </div>

        <nav className="mt-6 space-y-1 stagger-children" aria-label="Account and app shortcuts">
          <button type="button" onClick={() => navigate('/')} className={navRowClass}>
            <span className="w-10 h-10 rounded-xl bg-[var(--drift-surface-overlay)] flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5 text-[var(--drift-ink-muted)]" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <span className="font-medium text-[var(--drift-ink)] block">Dine</span>
              <span className="text-sm text-[var(--drift-ink-muted)]">Scan & order</span>
            </div>
          </button>
          <button type="button" onClick={openAddCard} className={navRowClass}>
            <span className="w-10 h-10 rounded-xl bg-[var(--drift-surface-overlay)] flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-[var(--drift-ink-muted)]" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <span className="font-medium text-[var(--drift-ink)] block">Payment method</span>
              <span className="text-sm text-[var(--drift-ink-muted)]">Card for faster checkout</span>
            </div>
          </button>
        </nav>

        <div className="mt-8 pt-6 border-t border-[var(--drift-border)]">
          <Button
            variant="text"
            fullWidth
            onClick={() => signOut().then(() => navigate('/'))}
            icon={<LogOut className="w-4 h-4" />}
            className="text-[var(--drift-ink-muted)]"
          >
            Sign out
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
