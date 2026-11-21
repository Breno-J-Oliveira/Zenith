'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Goal, GoalStatus } from '@zenith/shared';
import { Plus, Target } from 'lucide-react';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { GoalCard, statusLabels } from '../../components/goals/GoalCard';
import { GoalForm, categoryLabels, emptyGoalDraft, type GoalDraft } from '../../components/goals/GoalForm';
import { apiGet, apiPost, apiPatch, apiDelete, apiPut } from '@/lib/api';

function GoalsPageContent() {
  const searchParams = useSearchParams();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<string | undefined>();
  const [draft, setDraft] = useState(emptyGoalDraft);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [milestones, setMilestones] = useState<Record<string, string>>({});
  const [tasks, setTasks] = useState<Record<string, string>>({});
  const addButton = useRef<HTMLButtonElement>(null);
  const filtersActive = Boolean(status || category);

  useEffect(() => {
    if (searchParams.get('new') === 'true') setEditing('');
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);
    const params = { ...(status && { status }), ...(category && { category }) };
    apiGet<Goal[]>('/goals', { params, signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setGoals(data); })
      .catch(() => { if (!controller.signal.aborted) setLoadError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [status, category, reload]);

  const refresh = () => setReload(attempt => attempt + 1);

  function startForm(goal?: Goal) {
    setDraft(goal ? {
      title: goal.title, description: goal.description ?? '', category: goal.category,
      priority: goal.priority, deadline: goal.deadline?.slice(0, 10) ?? '',
    } : emptyGoalDraft);
    setFormError('');
    setEditing(goal?.id ?? '');
    if (goal) setExpanded(goal.id);
  }

  function closeForm() {
    const create = editing === '';
    setEditing(undefined);
    setFormError('');
    if (create) addButton.current?.focus();
  }

  async function save() {
    if (saving || editing === undefined || !draft.title.trim()) return;
    setSaving(true);
    setFormError('');
    try {
      const fields = { ...draft, title: draft.title.trim(), description: draft.description.trim() };
      if (editing) {
        await apiPut(`/goals/${editing}`, { ...fields, deadline: draft.deadline || null });
      } else {
        await apiPost('/goals', { ...fields, deadline: draft.deadline || undefined });
      }
      closeForm();
      refresh();
    } catch {
      setFormError('Não foi possível salvar a meta. Seus dados foram mantidos.');
    } finally {
      setSaving(false);
    }
  }

  async function change(goalId: string, action: () => Promise<unknown>, message: string) {
    if (busy[goalId]) return;
    setBusy(prev => ({ ...prev, [goalId]: true }));
    setErrors(prev => ({ ...prev, [goalId]: '' }));
    try {
      await action();
      refresh();
    } catch {
      setErrors(prev => ({ ...prev, [goalId]: message }));
    } finally {
      setBusy(prev => ({ ...prev, [goalId]: false }));
    }
  }

  function renderForm(isEdit: boolean) {
    return (
      <GoalForm draft={draft} setDraft={(value: GoalDraft) => setDraft(value)} onSubmit={() => void save()}
        onCancel={closeForm} saving={saving} editing={isEdit} error={formError} />
    );
  }

  return (
    <ShellLayout>
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-surface-2)] pb-6">
          <div>
            <h1 className="font-orbitron text-2xl font-bold tracking-tight sm:text-3xl">Metas</h1>
            <p className="mt-2 text-[var(--color-text-secondary)]">Organize objetivos em marcos e tarefas que você pode acompanhar.</p>
          </div>
          <button ref={addButton} type="button" className="btn btn-primary min-h-11" onClick={() => startForm()} disabled={saving}>
            <Plus size={18} aria-hidden="true" /> Nova meta
          </button>
        </header>

        {editing === '' && <div className="card mt-5">{renderForm(false)}</div>}

        <div className="grid gap-3 py-5 sm:grid-cols-2">
          <label className="min-w-0 space-y-1">
            <span className="text-sm font-semibold">Status</span>
            <select value={status} onChange={event => setStatus(event.target.value)} className="input w-full">
              <option value="">Todos os status</option>
              {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
          <label className="min-w-0 space-y-1">
            <span className="text-sm font-semibold">Categoria</span>
            <select value={category} onChange={event => setCategory(event.target.value)} className="input w-full">
              <option value="">Todas as categorias</option>
              {Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
        </div>

        {loading && <p role="status" className="py-4 text-[var(--color-text-secondary)]">Carregando metas…</p>}
        {loadError && (
          <div className="card space-y-3 p-4">
            <p role="alert">Não foi possível carregar as metas.</p>
            <button type="button" className="btn btn-secondary min-h-11" onClick={refresh}>Tentar novamente</button>
          </div>
        )}
        {!loading && !loadError && goals.length === 0 && (
          <div className="card p-5 sm:p-7">
            <Target size={24} className="mb-3 text-[var(--color-primary)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">{filtersActive ? 'Nenhuma meta com esses filtros' : 'O que você quer alcançar?'}</h2>
            {filtersActive ? (
              <button type="button" className="btn btn-secondary mt-3 min-h-11" onClick={() => { setStatus(''); setCategory(''); }}>
                Limpar filtros
              </button>
            ) : <p className="mt-1 text-[var(--color-text-secondary)]">Crie uma meta e defina um primeiro passo.</p>}
          </div>
        )}
        {!loadError && (
          <div className="space-y-3" aria-busy={loading}>
            {goals.map(goal => (
              <GoalCard key={goal.id} goal={goal} isExpanded={expanded === goal.id} busy={Boolean(busy[goal.id]) || saving}
                error={errors[goal.id]} editForm={editing === goal.id ? renderForm(true) : undefined}
                onEdit={() => startForm(goal)} onToggleExpand={() => setExpanded(expanded === goal.id ? null : goal.id)}
                onStatusChange={(next: GoalStatus) => void change(goal.id, () => apiPut(`/goals/${goal.id}`, { status: next }), 'Não foi possível alterar o status.')}
                onDelete={() => {
                  if (window.confirm(`Excluir a meta “${goal.title}” e os itens vinculados?`)) {
                    void change(goal.id, () => apiDelete(`/goals/${goal.id}`), 'Não foi possível excluir a meta.');
                  }
                }}
                newMilestoneValue={milestones[goal.id] ?? ''}
                onNewMilestoneChange={title => setMilestones(prev => ({ ...prev, [goal.id]: title }))}
                onAddMilestone={title => void change(goal.id, async () => {
                  await apiPost(`/goals/${goal.id}/milestones`, { title: title.trim() });
                  setMilestones(prev => ({ ...prev, [goal.id]: '' }));
                }, 'Não foi possível adicionar o marco. Seu texto foi mantido.')}
                onToggleMilestone={id => void change(goal.id, () => apiPatch(`/goals/${goal.id}/milestones/${id}/toggle`), 'Não foi possível atualizar o marco.')}
                onDeleteMilestone={id => void change(goal.id, () => apiDelete(`/goals/${goal.id}/milestones/${id}`), 'Não foi possível excluir o marco.')}
                newTaskValue={tasks[goal.id] ?? ''}
                onNewTaskChange={title => setTasks(prev => ({ ...prev, [goal.id]: title }))}
                onAddTask={title => void change(goal.id, async () => {
                  await apiPost('/tasks', { title: title.trim(), goalId: goal.id });
                  setTasks(prev => ({ ...prev, [goal.id]: '' }));
                }, 'Não foi possível adicionar a tarefa. Seu texto foi mantido.')}
                onToggleTask={id => void change(goal.id, () => apiPatch(`/tasks/${id}/toggle`), 'Não foi possível atualizar a tarefa.')}
                onDeleteTask={id => void change(goal.id, () => apiDelete(`/tasks/${id}`), 'Não foi possível excluir a tarefa.')} />
            ))}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

export default function GoalsPage() {
  return <Suspense fallback={<p role="status" className="p-6">Carregando metas…</p>}><GoalsPageContent /></Suspense>;
}
