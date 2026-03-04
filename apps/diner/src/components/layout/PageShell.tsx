import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  /** Extra bottom padding when bottom nav is visible */
  withNav?: boolean;
}

export function PageShell({ children, withNav = true }: PageShellProps) {
  return (
    <main
      className={`min-h-screen bg-[var(--drift-surface-elevated)] ${withNav ? 'pb-20 safe-bottom' : ''}`}
    >
      {children}
    </main>
  );
}
