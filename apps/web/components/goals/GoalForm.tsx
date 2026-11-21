import type { Goal } from '@zenith/shared';
import { Check } from 'lucide-react';

export const categoryLabels: Record<Goal['category'], string> = {
  pessoal: 'Pessoal',
  trabalho: 'Trabalho',
  financeiro: 'Financeiro',
  saude: 'Saúde',
  estudo: 'Estudo',
};

export const priorityLabels: Record<Goal['priority'], string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

export type GoalDraft = Pick<Goal, 'title' | 'category' | 'priority'> & {
  description: string;
  deadline: string;
};

export const emptyGoalDraft: GoalDraft = {
  title: '',
  description: '',
  category: 'pessoal',
  priority: 'media',
  deadline: '',
};

interface GoalFormProps {
  draft: GoalDraft;
  setDraft: (draft: GoalDraft) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
  editing?: boolean;
  error?: string;
}

export function GoalForm({ draft, setDraft, onSubmit, onCancel, saving, editing, error }: GoalFormProps) {
  return (
    <form
      onSubmit={event => { event.preventDefault(); onSubmit(); }}
      className="space-y-4 p-4 sm:p-5"
    >
      <h2 className="font-orbitron text-base font-semibold">{editing ? 'Editar meta' : 'Nova meta'}</h2>
      <fieldset disabled={saving} className="min-w-0 space-y-4 disabled:opacity-75">
        <label className="block space-y-1">
          <span className="text-sm font-semibold">Título</span>
          <input
            type="text"
            value={draft.title}
            onChange={event => setDraft({ ...draft, title: event.target.value })}
            placeholder="Ex.: Entregar o TCC"
            className="input w-full"
            required
            autoFocus
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">Descrição <span className="font-normal text-dim">(opcional)</span></span>
          <textarea
            value={draft.description}
            onChange={event => setDraft({ ...draft, description: event.target.value })}
            className="input min-h-[72px] w-full resize-y"
            rows={2}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block min-w-0 space-y-1">
            <span className="text-sm font-semibold">Categoria</span>
            <select
              value={draft.category}
              onChange={event => setDraft({ ...draft, category: event.target.value as Goal['category'] })}
              className="input w-full"
            >
              {Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
          <label className="block min-w-0 space-y-1">
            <span className="text-sm font-semibold">Prioridade</span>
            <select
              value={draft.priority}
              onChange={event => setDraft({ ...draft, priority: event.target.value as Goal['priority'] })}
              className="input w-full"
            >
              {Object.entries(priorityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
          <label className="block min-w-0 space-y-1">
            <span className="text-sm font-semibold">Prazo <span className="font-normal text-dim">(opcional)</span></span>
            <input
              type="date"
              value={draft.deadline}
              onChange={event => setDraft({ ...draft, deadline: event.target.value })}
              className="input min-w-0 w-full"
            />
          </label>
        </div>
      </fieldset>
      {error && <p className="rounded-md border border-[var(--border-default)] px-3 py-2 text-sm" role="alert">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary min-h-11 disabled:opacity-60" disabled={saving || !draft.title.trim()}>
          <Check size={16} aria-hidden="true" />
          {saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar meta'}
        </button>
        <button type="button" className="btn btn-ghost min-h-11" onClick={onCancel} disabled={saving}>Cancelar</button>
      </div>
    </form>
  );
}
