import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { apiPost } from '@/lib/api';
import { addCivilDays, civilDateAnchor } from '../../../../packages/shared/src/civil-date';
import type { Task } from '../../../../packages/shared/src/types';

const MAX_TITLE_LENGTH = 200;
const dateLabel = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

export function formatTaskDate(date: string): string {
  return dateLabel.format(civilDateAnchor(date));
}

function createRequestId(): string {
  if (crypto.randomUUID) return crypto.randomUUID();

  // randomUUID exige contexto seguro. O piloto também roda via HTTP na rede local.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
  return [hex.slice(0, 4), hex.slice(4, 6), hex.slice(6, 8), hex.slice(8, 10), hex.slice(10)]
    .map((part) => part.join(''))
    .join('-');
}

interface CaptureFormProps {
  autoFocus: boolean;
  onSaved: (task: Task) => void;
}

export function CaptureForm({ autoFocus, onSaved }: CaptureFormProps) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [invalidTitle, setInvalidTitle] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);
  const request = useRef<{ title: string; requestId: string } | null>(null);

  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);

  async function capture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length > MAX_TITLE_LENGTH) {
      setInvalidTitle(true);
      setError(trimmedTitle ? 'Use até 200 caracteres.' : 'Digite um título para salvar.');
      input.current?.focus();
      return;
    }

    inFlight.current = true;
    setSaving(true);
    setError('');
    setInvalidTitle(false);
    try {
      // Se a resposta se perder, repetir o mesmo envio recupera a tarefa gravada.
      if (request.current?.title !== trimmedTitle) {
        request.current = { title: trimmedTitle, requestId: createRequestId() };
      }
      const task = await apiPost<Task>('/tasks/capture', request.current);
      request.current = null;
      setTitle('');
      onSaved(task);
    } catch {
      setError('Não foi possível confirmar a captura. Seu texto foi mantido. Tente novamente.');
    } finally {
      inFlight.current = false;
      setSaving(false);
      input.current?.focus();
    }
  }

  return (
    <form className="space-y-2" onSubmit={capture} noValidate aria-busy={saving}>
      <label htmlFor="capture-title" className="block text-sm font-medium text-[var(--color-text)]">
        Captura rápida
      </label>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          ref={input}
          id="capture-title"
          className="input min-h-11 min-w-0 w-full"
          type="text"
          value={title}
          readOnly={saving}
          placeholder="Ex.: Revisar slides de redes"
          aria-invalid={invalidTitle || undefined}
          aria-describedby={error ? 'capture-error' : undefined}
          onChange={(event) => {
            setTitle(event.target.value);
            setInvalidTitle(false);
            setError('');
          }}
        />
        <button type="submit" className="btn btn-primary min-h-11 justify-center" disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar na caixa'}
        </button>
      </div>
      {error && <p id="capture-error" role="alert" className="text-sm text-[var(--color-danger)]">{error}</p>}
    </form>
  );
}

interface PlanActionsProps {
  task: Task;
  today: string;
  busy: boolean;
  onPlan: (task: Task, date: string) => void;
}

export function PlanActions({ task, today, busy, onPlan }: PlanActionsProps) {
  const [choosingDate, setChoosingDate] = useState(false);
  const [date, setDate] = useState(task.date || '');
  const [dateError, setDateError] = useState('');
  const dateId = useId();
  const showDateButton = useRef<HTMLButtonElement>(null);

  function plan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!date || date <= today) {
      setDateError('Escolha uma data a partir de amanhã.');
      return;
    }
    onPlan(task, date);
  }

  function toggleDatePicker() {
    setChoosingDate((open) => !open);
    setDateError('');
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button
        type="button"
        className="btn btn-secondary min-h-11"
        aria-label={`Planejar para hoje: ${task.title}`}
        disabled={busy}
        onClick={() => onPlan(task, today)}
      >
        Hoje
      </button>
      <button
        ref={showDateButton}
        type="button"
        className="btn btn-secondary min-h-11"
        aria-expanded={choosingDate}
        aria-label={`Escolher outra data: ${task.title}`}
        disabled={busy}
        onClick={toggleDatePicker}
      >
        Outra data
      </button>
      {choosingDate && (
        <form onSubmit={plan} className="flex flex-wrap items-center gap-2 basis-full" noValidate>
          <label htmlFor={dateId} className="sr-only">Data de {task.title}</label>
          <input
            id={dateId}
            type="date"
            autoFocus
            className="input min-h-11 min-w-0 max-w-full"
            value={date}
            min={addCivilDays(today, 1)}
            disabled={busy}
            aria-invalid={!!dateError || undefined}
            aria-describedby={dateError ? `${dateId}-error` : undefined}
            onChange={(event) => {
              setDate(event.target.value);
              setDateError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setChoosingDate(false);
                showDateButton.current?.focus();
              }
            }}
          />
          <button type="submit" className="btn btn-primary min-h-11" disabled={busy}>Planejar</button>
          {dateError && <p id={`${dateId}-error`} role="alert" className="text-[var(--color-danger)] basis-full">{dateError}</p>}
        </form>
      )}
    </div>
  );
}
