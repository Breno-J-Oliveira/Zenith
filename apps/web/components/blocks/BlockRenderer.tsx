'use client';

import { useState } from 'react';

interface BlockData {
  id: string;
  type: string;
  content: any;
  order: number;
}

interface BlockRendererProps {
  block: BlockData;
  onUpdate: (id: string, content: any) => void;
  onDelete: (id: string) => void;
}

export function BlockRenderer({ block, onUpdate, onDelete }: BlockRendererProps) {
  switch (block.type) {
    case 'heading':
      return <HeadingBlock block={block} onUpdate={onUpdate} onDelete={onDelete} />;
    case 'text':
      return <TextBlock block={block} onUpdate={onUpdate} onDelete={onDelete} />;
    case 'todo':
      return <TodoBlock block={block} onUpdate={onUpdate} onDelete={onDelete} />;
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

function BlockWrapper({ children, onDelete, onDragStart }: { children: React.ReactNode; onDelete: () => void; onDragStart?: (e: React.DragEvent) => void }) {
  return (
    <div className="group flex items-start gap-2 py-1">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1">
        <span className="cursor-grab text-dim text-xs" draggable onDragStart={onDragStart}>⠿</span>
        <button onClick={onDelete} className="text-dim hover:text-red-400 text-xs">✕</button>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function HeadingBlock({ block, onUpdate, onDelete }: { block: BlockData; onUpdate: (id: string, content: any) => void; onDelete: (id: string) => void }) {
  const [text, setText] = useState(block.content.text || '');
  const level = block.content.level || 1;

  const handleBlur = () => {
    if (text !== (block.content.text || '')) {
      onUpdate(block.id, { ...block.content, text });
    }
  };

  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;

  return (
    <BlockWrapper onDelete={() => onDelete(block.id)}>
      <Tag
        className="font-mono text-primary font-bold outline-none bg-transparent w-full"
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        defaultValue={text}
      >
        {text}
      </Tag>
    </BlockWrapper>
  );
}

function TextBlock({ block, onUpdate, onDelete }: { block: BlockData; onUpdate: (id: string, content: any) => void; onDelete: (id: string) => void }) {
  const [text, setText] = useState(block.content.text || '');

  const handleBlur = () => {
    if (text !== (block.content.text || '')) {
      onUpdate(block.id, { ...block.content, text });
    }
  };

  return (
    <BlockWrapper onDelete={() => onDelete(block.id)}>
      <div
        className="font-mono text-sm text-dim outline-none bg-transparent w-full min-h-[1.5em]"
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
      >
        {text}
      </div>
    </BlockWrapper>
  );
}

function TodoBlock({ block, onUpdate, onDelete }: { block: BlockData; onUpdate: (id: string, content: any) => void; onDelete: (id: string) => void }) {
  const [checked, setChecked] = useState(block.content.checked || false);
  const [text, setText] = useState(block.content.text || '');

  const toggle = () => {
    const newChecked = !checked;
    setChecked(newChecked);
    onUpdate(block.id, { ...block.content, checked: newChecked });
  };

  const handleBlur = () => {
    if (text !== (block.content.text || '')) {
      onUpdate(block.id, { ...block.content, text });
    }
  };

  return (
    <BlockWrapper onDelete={() => onDelete(block.id)}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={toggle}
          className="accent-[var(--color-primary)]"
        />
        <span
          className={`font-mono text-sm outline-none bg-transparent flex-1 ${checked ? 'line-through text-dim opacity-50' : 'text-dim'}`}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur}
        >
          {text}
        </span>
      </div>
    </BlockWrapper>
  );
}

function TaskRefBlock({ block, onDelete }: { block: BlockData; onDelete: (id: string) => void }) {
  return (
    <BlockWrapper onDelete={() => onDelete(block.id)}>
      <div className="flex items-center gap-2 py-1 px-2 bg-surface-1 rounded border border-[var(--color-surface-2)]">
        <span className="text-xs">📋</span>
        <span className="font-mono text-sm text-dim">Task: {block.content.taskId || block.content.title || '—'}</span>
      </div>
    </BlockWrapper>
  );
}

function GoalRefBlock({ block, onDelete }: { block: BlockData; onDelete: (id: string) => void }) {
  return (
    <BlockWrapper onDelete={() => onDelete(block.id)}>
      <div className="flex items-center gap-2 py-1 px-2 bg-surface-1 rounded border border-[var(--color-surface-2)]">
        <span className="text-xs">🎯</span>
        <span className="font-mono text-sm text-dim">Meta: {block.content.goalId || block.content.title || '—'}</span>
      </div>
    </BlockWrapper>
  );
}

function ImageBlock({ block, onUpdate, onDelete }: { block: BlockData; onUpdate: (id: string, content: any) => void; onDelete: (id: string) => void }) {
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
