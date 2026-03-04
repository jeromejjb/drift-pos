import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAddCard } from '../contexts/AddCardContext';
import { User, LogOut, QrCode, Send, Wallet, CreditCard } from 'lucide-react';
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

  /* Open experience when not signed in — gate only when they want profile */
  if (!user) {
    return (
      <PageShell withNav>
        <header className="px-5 pt-6 pb-5 border-b border-[var(--drift-border)] bg-[var(--drift-surface-elevated)]">
          <p className="text-[11px] uppercase tracking-wider text-[var(--drift-ink-subtle)]">drift</p>
          <h1 className="text-2xl font-semibold text-[var(--drift-ink)] mt-1 tracking-tight">Me</h1>
        </header>
        <div className="px-5 py-12 max-w-md mx-auto">
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="w-28 h-28 rounded-[var(--drift-radius-2xl)] bg-[var(--drift-accent-muted)] flex items-center justify-center mb-8">
              <User className="w-14 h-14 text-[var(--drift-accent)]" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-[var(--drift-ink)] tracking-tight">Your profile</h2>
            <p className="text-[var(--drift-ink-muted)] text-[15px] mt-3 max-w-xs">
              Sign in to see your profile, activity, and preferences. No account needed to dine or browse.
            </p>
            <Button className="mt-10 min-w-[220px] py-4" onClick={() => setShowAuthGate(true)}>
              Sign in
            </Button>
            <button
              type="button"
              onClick={() => setShowAuthGate(true)}
              className="mt-4 text-sm text-[var(--drift-ink-muted)] underline hover:text-[var(--drift-ink)] transition-colors"
            >
              Create account
            </button>
          </div>
        </div>
        {showAuthGate && (
          <AuthGate
            reason="to see your profile"
            onSuccess={() => setShowAuthGate(false)}
            onDismiss={() => setShowAuthGate(false)}
          />
        )}
      </PageShell>
    );
  }

  return (
    <PageShell>
      <header className="px-5 pt-6 pb-5 border-b border-[var(--drift-border)] bg-[var(--drift-surface-elevated)]">
        <p className="text-[11px] uppercase tracking-wider text-[var(--drift-ink-subtle)]">drift</p>
        <h1 className="text-2xl font-semibold text-[var(--drift-ink)] mt-1 tracking-tight">Me</h1>
      </header>

      <div className="px-5 py-6 max-w-md mx-auto">
        <div className="flex items-center gap-4 p-5 rounded-[var(--drift-radius-xl)] bg-[var(--drift-surface)] border border-[var(--drift-border)] shadow-[var(--drift-shadow-sm)]">
          <div className="w-16 h-16 rounded-[var(--drift-radius-xl)] bg-[var(--drift-accent)] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {(user.email?.[0] || user.user_metadata?.name?.[0] || 'U').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[var(--drift-ink)] truncate">
              {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-sm text-[var(--drift-ink-muted)] truncate">{user.email}</p>
          </div>
        </div>

        <nav className="mt-8 space-y-1">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--drift-radius-lg)] hover:bg-[var(--drift-surface-overlay)] transition-colors text-left"
          >
            <QrCode className="w-5 h-5 text-[var(--drift-ink-muted)]" />
            <span className="text-[var(--drift-ink)] font-medium">Dine</span>
            <span className="text-sm text-[var(--drift-ink-muted)] ml-auto">Scan & order</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/pay')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--drift-radius-lg)] hover:bg-[var(--drift-surface-overlay)] transition-colors text-left"
          >
            <Send className="w-5 h-5 text-[var(--drift-ink-muted)]" />
            <span className="text-[var(--drift-ink)] font-medium">Pay</span>
            <span className="text-sm text-[var(--drift-ink-muted)] ml-auto">Send money</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/money')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--drift-radius-lg)] hover:bg-[var(--drift-surface-overlay)] transition-colors text-left"
          >
            <Wallet className="w-5 h-5 text-[var(--drift-ink-muted)]" />
            <span className="text-[var(--drift-ink)] font-medium">Money</span>
            <span className="text-sm text-[var(--drift-ink-muted)] ml-auto">Budget & activity</span>
          </button>
          <button
            type="button"
            onClick={openAddCard}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--drift-radius-lg)] hover:bg-[var(--drift-surface-overlay)] transition-colors text-left"
          >
            <CreditCard className="w-5 h-5 text-[var(--drift-ink-muted)]" />
            <span className="text-[var(--drift-ink)] font-medium">Payment method</span>
            <span className="text-sm text-[var(--drift-ink-muted)] ml-auto">Add or update card</span>
          </button>
        </nav>

        <div className="mt-8 pt-8 border-t border-[var(--drift-border)]">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => signOut().then(() => navigate('/'))}
            icon={<LogOut className="w-4 h-4" />}
          >
            Sign out
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
