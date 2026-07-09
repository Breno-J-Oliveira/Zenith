interface MilestoneItemProps {
  title: string;
  deadline?: string;
  completed: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export function MilestoneItem({ title, deadline, completed, onToggle, onDelete }: MilestoneItemProps) {
  return (
    <div className="flex items-center gap-2 group">
      <button
        onClick={onToggle}
        className={`w-4 h-4 rounded border shrink-0 transition-colors ${
          completed
            ? 'bg-primary border-primary'
            : 'border-[var(--color-surface-2)] hover:border-[var(--color-primary)]'
        }`}
      >
        {completed && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="mx-auto">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <span className={`text-sm flex-1 ${completed ? 'line-through text-dim' : 'text-white'}`}>
        {title}
      </span>
      {deadline && <span className="font-mono text-xs text-dim">{new Date(deadline).toLocaleDateString('pt-BR')}</span>}
      <button
        onClick={onDelete}
        className="text-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
      >
        ✕
      </button>
    </div>
  );
}
