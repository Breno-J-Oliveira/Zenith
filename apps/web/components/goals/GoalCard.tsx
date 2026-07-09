import { ProgressBar } from './ProgressBar';
import { MilestoneItem } from './MilestoneItem';

interface Task {
  id: string;
  goalId?: string;
  title: string;
  completed: boolean;
  status: string;
}

interface Milestone {
  id: string;
  goalId: string;
  title: string;
  deadline?: string;
  completed: boolean;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  deadline?: string;
  milestones: Milestone[];
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

interface GoalCardProps {
  goal: Goal;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (status: string) => void;
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

const categoryLabels: Record<string, string> = {
  pessoal: 'Pessoal',
  trabalho: 'Trabalho',
  financeiro: 'Financeiro',
  saude: 'Saúde',
  estudo: 'Estudo',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativa',
  COMPLETED: 'Concluída',
  PAUSED: 'Pausada',
  CANCELLED: 'Cancelada',
};

const priorityColors: Record<string, string> = {
  alta: 'var(--color-primary)',
  media: 'var(--color-text-dim)',
  baixa: 'var(--color-surface-2)',
};

function calcProgress(goal: Goal): number {
  const items = [...goal.milestones, ...goal.tasks];
  if (items.length === 0) return 0;
  const done = items.filter(i => i.completed).length;
  return Math.round((done / items.length) * 100);
}

export function GoalCard({
  goal, isExpanded, onToggleExpand,
  onStatusChange, onDelete,
  onAddMilestone, onToggleMilestone, onDeleteMilestone,
  onAddTask, onToggleTask, onDeleteTask,
  newMilestoneValue, onNewMilestoneChange,
  newTaskValue, onNewTaskChange,
}: GoalCardProps) {
  const progress = calcProgress(goal);

  return (
    <div className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg overflow-hidden">
      {/* Goal header */}
      <div
        className="p-5 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ background: priorityColors[goal.priority] || 'var(--color-text-dim)' }}
              />
              <h3 className="font-orbitron text-lg font-bold truncate">{goal.title}</h3>
            </div>
            {goal.description && <p className="text-sm text-dim truncate">{goal.description}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-xs px-2 py-1 rounded border border-[var(--color-surface-2)] text-dim">
              {categoryLabels[goal.category] || goal.category}
            </span>
            <span className="font-mono text-xs px-2 py-1 rounded border border-[var(--color-surface-2)] text-dim">
              {statusLabels[goal.status] || goal.status}
            </span>
          </div>
        </div>

        <ProgressBar progress={progress} />

        <div className="flex items-center gap-4 mt-3 text-xs text-dim font-mono">
          <span>{goal.milestones.length} marcos</span>
          <span>{goal.tasks.length} tarefas</span>
          {goal.deadline && <span>Deadline: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-[var(--color-surface-2)] p-5 space-y-4 bg-[var(--color-bg)]">
          {/* Status controls */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-dim">STATUS:</span>
            {['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'].map(s => (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={`font-mono text-xs px-2 py-1 rounded border transition-colors ${
                  goal.status === s
                    ? 'border-[var(--color-primary)] text-primary'
                    : 'border-[var(--color-surface-2)] text-dim hover:text-white'
                }`}
              >
                {statusLabels[s]}
              </button>
            ))}
            <button
              onClick={onDelete}
              className="ml-auto font-mono text-xs px-2 py-1 rounded border border-[var(--color-surface-2)] text-dim hover:text-red-400 hover:border-red-400 transition-colors"
            >
              Excluir
            </button>
          </div>

          {/* Milestones */}
          <div>
            <p className="font-mono text-xs text-dim mb-2">MARCOS</p>
            {goal.milestones.length === 0 ? (
              <p className="text-sm text-dim mb-2">Nenhum marco ainda.</p>
            ) : (
              <div className="space-y-1 mb-2">
                {goal.milestones.map(ms => (
                  <MilestoneItem
                    key={ms.id}
                    title={ms.title}
                    deadline={ms.deadline}
                    completed={ms.completed}
                    onToggle={() => onToggleMilestone(ms.id)}
                    onDelete={() => onDeleteMilestone(ms.id)}
                  />
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMilestoneValue}
                onChange={e => onNewMilestoneChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddMilestone(newMilestoneValue); } }}
                placeholder="Novo marco..."
                className="flex-1 bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded px-3 py-1.5 text-sm text-white placeholder:text-dim focus:outline-none focus:border-[var(--color-primary)]"
              />
              <button
                onClick={() => onAddMilestone(newMilestoneValue)}
                className="font-mono text-xs px-3 py-1.5 rounded border border-[var(--color-surface-2)] text-dim hover:text-primary hover:border-[var(--color-primary)] transition-colors"
              >
                + Marco
              </button>
            </div>
          </div>

          {/* Tasks */}
          <div>
            <p className="font-mono text-xs text-dim mb-2">TAREFAS</p>
            {goal.tasks.length === 0 ? (
              <p className="text-sm text-dim mb-2">Nenhuma tarefa vinculada.</p>
            ) : (
              <div className="space-y-1 mb-2">
                {goal.tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className={`w-4 h-4 rounded border shrink-0 transition-colors ${
                        task.completed
                          ? 'bg-primary border-primary'
                          : 'border-[var(--color-surface-2)] hover:border-[var(--color-primary)]'
                      }`}
                    >
                      {task.completed && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="mx-auto">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <span className={`text-sm flex-1 ${task.completed ? 'line-through text-dim' : 'text-white'}`}>
                      {task.title}
                    </span>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="text-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskValue}
                onChange={e => onNewTaskChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddTask(newTaskValue); } }}
                placeholder="Nova tarefa..."
                className="flex-1 bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded px-3 py-1.5 text-sm text-white placeholder:text-dim focus:outline-none focus:border-[var(--color-primary)]"
              />
              <button
                onClick={() => onAddTask(newTaskValue)}
                className="font-mono text-xs px-3 py-1.5 rounded border border-[var(--color-surface-2)] text-dim hover:text-primary hover:border-[var(--color-primary)] transition-colors"
              >
                + Tarefa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
