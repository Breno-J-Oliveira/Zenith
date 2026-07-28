interface MilestoneItemProps {
  title: string;
  deadline?: string;
  completed: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export function MilestoneItem({ title, deadline, completed, onToggle, onDelete }: MilestoneItemProps) {
  return (
    <div className="flex items-center gap-2 group py-1 px-2 rounded-md hover:bg-[var(--color-surface-2)]/30 transition-colors">
      <button
        onClick={onToggle}
        className={`w-4 h-4 rounded border shrink-0 transition-all duration-200 flex items-center justify-center ${
          completed
            ? 'bg-[var(--color-success)] border-[var(--color-success)] glow-subtle'
            : 'border-[var(--border-default)] hover:border-[var(--color-primary)]'
        }`}
      >
        {completed && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="mx-auto">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <span className={`text-sm flex-1 transition-all duration-200 ${completed ? 'line-through text-muted' : 'text-[var(--color-text)]'}`}>
        {title}
      </span>
      {deadline && (
        <span className="font-mono text-xs text-muted px-2 py-0.5 rounded bg-[var(--color-surface-2)]">
          📅 {new Date(deadline).toLocaleDateString('pt-BR')}
        </span>
      )}
      <button
        onClick={onDelete}
        className="text-muted hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs"
      >
        ✕
      </button>
    </div>
  );
}