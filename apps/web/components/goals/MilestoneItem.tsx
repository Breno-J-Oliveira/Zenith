import { CalendarDays, Check, Trash2 } from 'lucide-react';

interface MilestoneItemProps {
  title: string;
  deadline?: string;
  completed: boolean;
  disabled: boolean;
  kind: 'marco' | 'tarefa';
  onToggle: () => void;
  onDelete: () => void;
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });

export function GoalDeadline({ deadline }: { deadline: string }) {
  const date = new Date(deadline);
  if (!Number.isFinite(date.getTime())) return null;

  return (
    <span className="inline-flex items-center gap-1.5">
      <CalendarDays size={14} aria-hidden="true" />
      <time dateTime={deadline}>{dateFormatter.format(date)}</time>
    </span>
  );
}

export function MilestoneItem({ title, deadline, completed, disabled, kind, onToggle, onDelete }: MilestoneItemProps) {
  return (
    <li className="flex min-w-0 items-center gap-2 border-b border-[var(--border-subtle)] last:border-0">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={`${kind === 'marco' ? 'Marco' : 'Tarefa'}: ${title}`}
        aria-pressed={completed}
        className="group flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
      >
        <span
          className={`grid size-5 shrink-0 place-items-center rounded border transition-colors ${
            completed
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
              : 'border-[var(--border-default)] group-hover:border-[var(--color-primary)]'
          }`}
          aria-hidden="true"
        >
          {completed && <Check size={14} />}
        </span>
        <span className={`min-w-0 flex-1 break-words text-base ${completed ? 'text-dim line-through' : ''}`}>{title}</span>
      </button>
      {deadline && <span className="hidden shrink-0 font-mono text-xs text-dim sm:inline-flex"><GoalDeadline deadline={deadline} /></span>}
      <button
        type="button"
        disabled={disabled}
        onClick={onDelete}
        className="btn btn-ghost size-11 shrink-0 p-0 hover:text-[var(--color-danger)]"
        aria-label={`Excluir ${kind}: ${title}`}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </li>
  );
}
