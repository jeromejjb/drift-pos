import { NavLink, useLocation } from 'react-router-dom';
import { QrCode, Send, Wallet, User } from 'lucide-react';

const navItems = [
  { to: '/', icon: QrCode, label: 'Dine' },
  { to: '/pay', icon: Send, label: 'Pay' },
  { to: '/money', icon: Wallet, label: 'Money' },
  { to: '/me', icon: User, label: 'Me' },
];

export function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--drift-surface)]/98 backdrop-blur-md border-t border-[var(--drift-border)] safe-bottom z-50 shadow-[var(--drift-shadow-up)]">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 safe-bottom">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = path === to || (to !== '/' && path.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              className={`
                flex flex-col items-center justify-center gap-1 flex-1 h-full min-h-[44px]
                transition-colors duration-[var(--drift-duration)] ease-[var(--drift-ease)]
                ${isActive ? 'text-[var(--drift-accent)]' : 'text-[var(--drift-ink-subtle)]'}
              `}
            >
              <Icon className={`w-6 h-6 transition-all duration-[var(--drift-duration)] ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-xs font-semibold">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
