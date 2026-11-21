'use client';

import { ListTodo, Target, Trash2 } from 'lucide-react';
import { type FormEvent, useId, useRef, useState } from 'react';

interface BlockData {
  id: string;
  type: string;
  content: any;
  order: number;
}

interface BlockRendererProps {
  block: BlockData;
  onUpdate: (id: string, content: any) => Promise<void>;
  onDelete: (id: string) => void;
}

export function BlockRenderer({ block, onUpdate, onDelete }: BlockRendererProps) {
  switch (block.type) {
    case 'heading':
    case 'text':
    case 'todo':
      return <EditableTextBlock block={block} onUpdate={onUpdate} onDelete={onDelete} />;
    case 'task_ref':
      return <TaskRefBlock block={block} onDelete={onDelete} />;
    case 'goal_ref':
      return <GoalRefBlock block={block} onDelete={onDelete} />;
    case 'image':
      return <ImageBlock block={block} onUpdate={onUpdate} onDelete={onDelete} />;
    case 'divider':
      return <DividerBlock block={block} onDelete={onDelete} />;
    default:
      return <div className="text-dim text-sm">Tipo desconhecido: {block.type}</div>;
  }
}

function BlockWrapper({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return (
    <div className="group flex items-start gap-2 py-1">
      <div className="min-w-0 flex-1">{children}</div>
      <button type="button" onClick={onDelete} aria-label="Excluir bloco"
        className="grid h-10 w-10 shrink-0 place-items-center rounded text-dim hover:text-red-400 focus-visible:outline">
        <Trash2 aria-hidden="true" size={16} />
      </button>
    </div>
  );
}

function EditableTextBlock({ block, onUpdate, onDelete }: BlockRendererProps) {
  const [text, setText] = useState<string>(block.content.text ?? '');
  const [checked, setChecked] = useState<boolean>(block.content.checked ?? false);
  const [saved, setSaved] = useState({ text, checked });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const inFlight = useRef(false);
  const id = useId();
  const todo = block.type === 'todo';
  const heading = block.type === 'heading';
  const label = heading ? 'Título do bloco' : todo ? 'Texto do item' : 'Texto do bloco';
  const dirty = text !== saved.text || checked !== saved.checked;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !dirty) return;
    inFlight.current = true;
    setStatus('saving');
    try {
      await onUpdate(block.id, { ...block.content, text, ...(todo && { checked }) });
      setSaved({ text, checked });
      setStatus('saved');
    } catch {
      setStatus('error');
    } finally {
      inFlight.current = false;
    }
  }

  const fieldClass = `input min-w-0 w-full ${heading ? 'font-bold text-primary' : ''} ${todo && checked ? 'line-through' : ''}`;
  return (
    <BlockWrapper onDelete={() => onDelete(block.id)}>
      <form onSubmit={save} className="min-w-0 space-y-2" aria-busy={status === 'saving'}>
        <div className="flex items-start gap-2">
          {todo && (
            <input type="checkbox" aria-label="Item concluído" className="mt-3 accent-[var(--color-primary)]"
              checked={checked} onChange={event => setChecked(event.target.checked)} />
          )}
          <label htmlFor={id} className="sr-only">{label}</label>
          {block.type === 'text' ? (
            <textarea id={id} rows={2} value={text} className={fieldClass} placeholder="Escreva um texto"
              onChange={event => setText(event.target.value)} />
          ) : (
            <input id={id} value={text} className={fieldClass} placeholder={label}
              onChange={event => setText(event.target.value)} />
          )}
        </div>
        {dirty && (
          <button type="submit" disabled={status === 'saving'} className="btn btn-secondary min-h-11">
            {status === 'saving' ? 'Salvando…' : status === 'error' ? 'Tentar salvar novamente' : 'Salvar bloco'}
          </button>
        )}
        {status === 'error' && <p role="alert" className="text-sm text-[var(--color-danger)]">Falha ao salvar. Seu texto foi mantido nesta página.</p>}
        {status === 'saved' && !dirty && <p role="status" className="text-sm text-dim">Bloco salvo.</p>}
      </form>
    </BlockWrapper>
  );
}

function TaskRefBlock({ block, onDelete }: { block: BlockData; onDelete: (id: string) => void }) {
  return (
    <BlockWrapper onDelete={() => onDelete(block.id)}>
      <div className="flex items-center gap-2 py-1 px-2 bg-surface-1 rounded border border-[var(--color-surface-2)]">
        <ListTodo aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span className="font-mono text-sm text-dim">Task: {block.content.taskId || block.content.title || '—'}</span>
      </div>
    </BlockWrapper>
  );
}

function GoalRefBlock({ block, onDelete }: { block: BlockData; onDelete: (id: string) => void }) {
  return (
    <BlockWrapper onDelete={() => onDelete(block.id)}>
      <div className="flex items-center gap-2 py-1 px-2 bg-surface-1 rounded border border-[var(--color-surface-2)]">
        <Target aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span className="font-mono text-sm text-dim">Meta: {block.content.goalId || block.content.title || '—'}</span>
      </div>
    </BlockWrapper>
  );
}

function ImageBlock({ block, onUpdate, onDelete }: { block: BlockData; onUpdate: (id: string, content: any) => Promise<void>; onDelete: (id: string) => void }) {
  const [url, setUrl] = useState(block.content.url || '');

  const handleBlur = () => {
    if (url !== (block.content.url || '')) {
      onUpdate(block.id, { ...block.content, url });
    }
  };

  return (
    <BlockWrapper onDelete={() => onDelete(block.id)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="max-w-full rounded border border-[var(--color-surface-2)]" />
      ) : (
        <input
          type="text"
          placeholder="URL da imagem..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          onBlur={handleBlur}
          className="font-mono text-sm bg-surface-1 border border-[var(--color-surface-2)] rounded px-2 py-1 w-full text-dim"
        />
      )}
    </BlockWrapper>
  );
}

function DividerBlock({ block, onDelete }: { block: BlockData; onDelete: (id: string) => void }) {
  return (
    <BlockWrapper onDelete={() => onDelete(block.id)}>
      <hr className="border-[var(--color-surface-2)] my-2" />
    </BlockWrapper>
  );
}
