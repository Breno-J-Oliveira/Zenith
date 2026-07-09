interface EventBadgeProps {
  type: 'task' | 'appointment' | 'routine';
  done?: boolean;
}

export function EventBadge({ type, done }: EventBadgeProps) {
  const colors: Record<string, string> = {
    task: 'var(--color-primary)',
    routine: 'var(--color-text-dim)',
    appointment: '#8b5cf6',
  };

  const labels: Record<string, string> = {
    task: 'Tarefa',
    routine: 'Rotina',
    appointment: 'Compromisso',
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-xs px-2 py-0.5 rounded"
      style={{
        color: done ? 'var(--color-text-dim)' : colors[type],
        border: `1px solid ${done ? 'var(--color-surface-2)' : colors[type]}`,
        opacity: done ? 0.5 : 1,
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: done ? 'var(--color-surface-2)' : colors[type] }}
      />
      {labels[type]}
    </span>
  );
}
