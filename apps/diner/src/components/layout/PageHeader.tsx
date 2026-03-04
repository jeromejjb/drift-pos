import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backTo?: string;
  right?: ReactNode;
  /** If true, uses elevated surface and border for sticky header */
  sticky?: boolean;
}

export function PageHeader({ title, subtitle, onBack, backTo, right, sticky = true }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else if (backTo) navigate(backTo);
    else navigate(-1);
  };

  const showBack = onBack !== undefined || backTo !== undefined;

  return (
    <header
      className={`
        flex items-center gap-3 px-4 py-3
        ${sticky ? 'sticky top-0 z-40 bg-[var(--drift-surface-elevated)]/95 backdrop-blur border-b border-[var(--drift-border)]' : ''}
      `}
    >
      {showBack && (
        <button
          type="button"
          onClick={handleBack}
          className="p-2 -ml-2 rounded-[var(--drift-radius)] text-[var(--drift-ink-muted)] hover:text-[var(--drift-ink)] hover:bg-[var(--drift-surface-overlay)] transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-[var(--drift-ink-subtle)]">drift</p>
        <h1 className="text-lg font-semibold text-[var(--drift-ink)] truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[var(--drift-ink-muted)] truncate">{subtitle}</p>
        )}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </header>
  );
}
