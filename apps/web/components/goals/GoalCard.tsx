import type { Goal, GoalStatus } from '@zenith/shared';
import type { ReactNode } from 'react';
import { ChevronDown, Flag, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { categoryLabels, priorityLabels } from './GoalForm';
import { GoalDeadline, MilestoneItem } from './MilestoneItem';
import { ProgressBar } from './ProgressBar';

export const statusLabels: Record<GoalStatus, string> = {
  ACTIVE: 'Ativa',
  COMPLETED: 'Concluída',
  PAUSED: 'Pausada',
  CANCELLED: 'Cancelada',
};

const statusClasses: Record<GoalStatus, string> = {
  ACTIVE: 'badge-primary',
  COMPLETED: 'badge-success',
  PAUSED: 'badge-warning',
  CANCELLED: 'badge-danger',
};

export function calcProgress(goal: Goal): number {
  const items = [...goal.milestones, ...goal.tasks];
  return items.length ? Math.round((items.filter(item => item.completed).length / items.length) * 100) : 0;
}

interface GoalCardProps {
  goal: Goal;
  isExpanded: boolean;
  busy: boolean;
  error?: string;
  editForm?: ReactNode;
  onEdit: () => void;
  onToggleExpand: () => void;
  onStatusChange: (status: GoalStatus) => void;
  onDelete: () => void;
  onAddMilestone: (title: string) => void;
  onToggleMilestone: (milestoneId: string) => void;
  onDeleteMilestone: (milestoneId: string) => void;
  onAddTask: (title: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  newMilestoneValue: string;
  onNewMilestoneChange: (value: string) => void;
  newTaskValue: string;
  onNewTaskChange: (value: string) => void;
}

function AddGoalItem({ kind, title, onChange, onAdd, disabled }: {
  kind: 'marco' | 'tarefa';
  title: string;
  onChange: (title: string) => void;
  onAdd: (title: string) => void;
  disabled: boolean;
}) {
  return (
    <form
      onSubmit={event => { event.preventDefault(); onAdd(title); }}
      className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2"
    >
      <input
        className="input min-h-11 min-w-0"
        value={title}
        onChange={event => onChange(event.target.value)}
        placeholder={kind === 'marco' ? 'Novo marco' : 'Nova tarefa'}
        aria-label={`Título do item: ${kind}`}
        disabled={disabled}
        required
      />
      <button
        type="submit"
        className="btn btn-secondary min-h-11 disabled:opacity-60"
        aria-label={`Adicionar ${kind}`}
        disabled={disabled || !title.trim()}
      >
        <Plus size={16} aria-hidden="true" />
        <span className="hidden sm:inline">Adicionar</span>
      </button>
    </form>
  );
}

export function GoalCard({
  goal, isExpanded, busy, error, editForm, onEdit, onToggleExpand,
  onStatusChange, onDelete,
  onAddMilestone, onToggleMilestone, onDeleteMilestone,
  onAddTask, onToggleTask, onDeleteTask,
  newMilestoneValue, onNewMilestoneChange,
  newTaskValue, onNewTaskChange,
}: GoalCardProps) {
  const detailsId = `meta-detalhes-${goal.id}`;

  return (
    <article className="card min-w-0 overflow-hidden">
      <header className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-2">
            <h2 className="font-orbitron text-base font-semibold leading-snug [overflow-wrap:anywhere] sm:text-lg">
              {goal.title}
            </h2>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-dim">
              <span className={`badge ${statusClasses[goal.status] ?? ''}`}>{statusLabels[goal.status] ?? goal.status}</span>
              <span>{categoryLabels[goal.category] ?? goal.category}</span>
              <span>Prioridade {priorityLabels[goal.priority]?.toLowerCase() ?? goal.priority}</span>
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost min-h-11 shrink-0"
            aria-expanded={isExpanded}
            aria-controls={detailsId}
            aria-label={`${isExpanded ? 'Recolher' : 'Abrir'} detalhes de ${goal.title}`}
            onClick={onToggleExpand}
            disabled={busy}
          >
            <span className="hidden sm:inline">Detalhes</span>
            <ChevronDown size={18} className={isExpanded ? 'rotate-180' : ''} aria-hidden="true" />
          </button>
        </div>
        {goal.description && (
          <p className="whitespace-pre-line text-sm text-dim [overflow-wrap:anywhere]">{goal.description}</p>
        )}
        <ProgressBar progress={calcProgress(goal)} label={`Progresso de ${goal.title}`} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-dim">
          <span className="inline-flex items-center gap-1.5">
            <Flag size={14} aria-hidden="true" /> {goal.milestones.length} {goal.milestones.length === 1 ? 'marco' : 'marcos'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ListChecks size={14} aria-hidden="true" /> {goal.tasks.length} {goal.tasks.length === 1 ? 'tarefa' : 'tarefas'}
          </span>
          {goal.deadline && <GoalDeadline deadline={goal.deadline} />}
        </div>
      </header>

      {isExpanded && (
        <div id={detailsId} className="border-t border-[var(--border-default)]">
          {editForm ?? (
            <div className="space-y-5 p-4 sm:p-5">
              {error && <p className="rounded-md border border-[var(--border-default)] px-3 py-2 text-sm" role="alert">{error}</p>}
              <div className="flex flex-wrap items-end gap-2">
                <label className="block space-y-1">
                  <span className="text-sm font-semibold">Situação</span>
                  <select
                    value={goal.status}
                    onChange={event => onStatusChange(event.target.value as GoalStatus)}
                    className="input min-h-11"
                    disabled={busy}
                  >
                    {Object.entries(statusLabels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
                  </select>
                </label>
                <button type="button" className="btn btn-secondary min-h-11" onClick={onEdit} disabled={busy}>
                  <Pencil size={16} aria-hidden="true" /> Editar
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="btn btn-ghost min-h-11 hover:text-[var(--color-danger)] sm:ml-auto"
                  disabled={busy}
                >
                  <Trash2 size={16} aria-hidden="true" /> Excluir meta
                </button>
              </div>
              <section className="grid items-start gap-5 border-t border-[var(--border-subtle)] pt-4 md:grid-cols-2">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 text-base font-semibold">
                    <Flag size={16} aria-hidden="true" /> Marcos
                  </h3>
                  {goal.milestones.length > 0 ? (
                    <ul>
                      {goal.milestones.map(milestone => (
                        <MilestoneItem
                          key={milestone.id}
                          title={milestone.title}
                          deadline={milestone.deadline}
                          completed={milestone.completed}
                          disabled={busy}
                          kind="marco"
                          onToggle={() => onToggleMilestone(milestone.id)}
                          onDelete={() => onDeleteMilestone(milestone.id)}
                        />
                      ))}
                    </ul>
                  ) : <p className="mt-1 text-sm text-dim">Nenhum marco cadastrado.</p>}
                  <AddGoalItem kind="marco" title={newMilestoneValue} onChange={onNewMilestoneChange} onAdd={onAddMilestone} disabled={busy} />
                </div>
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 text-base font-semibold">
                    <ListChecks size={16} aria-hidden="true" /> Tarefas
                  </h3>
                  {goal.tasks.length > 0 ? (
                    <ul>
                      {goal.tasks.map(task => (
                        <MilestoneItem
                          key={task.id}
                          title={task.title}
                          completed={task.completed}
                          disabled={busy}
                          kind="tarefa"
                          onToggle={() => onToggleTask(task.id)}
                          onDelete={() => onDeleteTask(task.id)}
                        />
                      ))}
                    </ul>
                  ) : <p className="mt-1 text-sm text-dim">Nenhuma tarefa vinculada.</p>}
                  <AddGoalItem kind="tarefa" title={newTaskValue} onChange={onNewTaskChange} onAdd={onAddTask} disabled={busy} />
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
