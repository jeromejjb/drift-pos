import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-[var(--drift-radius-xl)] bg-[var(--drift-surface-overlay)] flex items-center justify-center text-[var(--drift-ink-muted)] mb-4">
        {icon}
      </div>
      <h3 className="text-base font-medium text-[var(--drift-ink)]">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-[var(--drift-ink-muted)] max-w-xs">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
