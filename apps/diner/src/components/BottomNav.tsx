import { NavLink, useLocation } from 'react-router-dom';
import { NAV_ITEMS, isDinePath } from '../config/nav';

function isNavActive(path: string, to: string): boolean {
  return (
    path === to ||
    (to !== '/' && path.startsWith(to)) ||
    (to === '/' && isDinePath(path))
  );
}

export function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-[var(--drift-surface)]/95 backdrop-blur-xl border-t border-[var(--drift-border)] safe-bottom z-50 shadow-[var(--drift-shadow-up)]"
      role="navigation"
      aria-label="Main"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around h-[72px] safe-bottom">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = isNavActive(path, to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`
                relative flex flex-col items-center justify-center gap-1.5 flex-1 h-full min-h-[44px]
                transition-colors duration-[var(--drift-duration)] ease-[var(--drift-ease)]
                ${active ? 'text-[var(--drift-accent)]' : 'text-[var(--drift-ink-subtle)] hover:text-[var(--drift-ink-muted)]'}
              `}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={`
                  relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-[var(--drift-duration)] ease-[var(--drift-ease)]
                  ${active ? 'bg-[var(--drift-accent-soft)]' : ''}
                `}
              >
                <Icon
                  className={`relative w-6 h-6 transition-all duration-[var(--drift-duration)] ${active ? 'stroke-[2.5]' : ''}`}
                />
              </span>
              <span className="text-[11px] font-semibold tracking-tight">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
