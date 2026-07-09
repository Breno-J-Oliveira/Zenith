'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShellLayout } from '../../../components/layout/ShellLayout';
import { BlockRenderer } from '../../../components/blocks/BlockRenderer';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';

const API = 'http://localhost:3002';

interface BlockData {
  id: string;
  type: string;
  content: any;
  order: number;
}

interface PageData {
  id: string;
  title: string;
  icon: string | null;
  blocks: BlockData[];
}

const BLOCK_TYPES = [
  { type: 'heading', label: 'Título', icon: 'H' },
  { type: 'text', label: 'Texto', icon: '¶' },
  { type: 'todo', label: 'To-do', icon: '☑' },
  { type: 'task_ref', label: 'Link Task', icon: '📋' },
  { type: 'goal_ref', label: 'Link Meta', icon: '🎯' },
  { type: 'image', label: 'Imagem', icon: '🖼' },
  { type: 'divider', label: 'Divisor', icon: '—' },
];

export default function PageEditor({ params }: { params: { id: string } }) {
  const [page, setPage] = useState<PageData | null>(null);
  const [title, setTitle] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchPage = useCallback(() => {
    fetch(`${API}/pages/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setPage(data);
        setTitle(data.title);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const updateTitle = async () => {
    if (!page || title === page.title) return;
    await fetch(`${API}/pages/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    setPage({ ...page, title });
  };

  const addBlock = async (type: string) => {
    const defaultContent: Record<string, any> = {
      heading: { text: '', level: 1 },
      text: { text: '' },
      todo: { text: '', checked: false },
      task_ref: { taskId: '' },
      goal_ref: { goalId: '' },
      image: { url: '' },
      divider: {},
    };

    const res = await fetch(`${API}/pages/${params.id}/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content: defaultContent[type] || {} }),
    });
    const newBlock = await res.json();
    setPage(prev => prev ? { ...prev, blocks: [...prev.blocks, newBlock] } : prev);
    setShowAddMenu(false);
  };

  const updateBlock = async (id: string, content: any) => {
    await fetch(`${API}/pages/blocks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  };

  const deleteBlock = async (id: string) => {
    await fetch(`${API}/pages/blocks/${id}`, { method: 'DELETE' });
    setPage(prev => prev ? { ...prev, blocks: prev.blocks.filter(b => b.id !== id) } : prev);
  };

  const handleDragEnd = async (event: any) => {
    if (!page) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = page.blocks.findIndex(b => b.id === active.id);
    const newIndex = page.blocks.findIndex(b => b.id === over.id);
    const newBlocks = arrayMove(page.blocks, oldIndex, newIndex);
    setPage({ ...page, blocks: newBlocks });

    await fetch(`${API}/pages/blocks/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: newBlocks.map((b, i) => ({ id: b.id, order: i })),
      }),
    });
  };

  if (loading) {
    return (
      <ShellLayout>
        <div className="px-8"><p className="font-mono text-sm text-dim">Carregando...</p></div>
      </ShellLayout>
    );
  }

  if (!page) {
    return (
      <ShellLayout>
        <div className="px-8">
          <p className="font-mono text-sm text-dim">Página não encontrada.</p>
          <Link href="/paginas" className="font-mono text-xs text-primary hover:underline">← Voltar</Link>
        </div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout>
      <div className="px-8 max-w-3xl">
        <div className="mb-4">
          <Link href="/paginas" className="font-mono text-xs text-dim hover:text-primary transition-colors">
            ← PÁGINAS
          </Link>
        </div>

        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={updateTitle}
          placeholder="Sem título"
          className="font-mono text-2xl text-primary bg-transparent outline-none w-full mb-6 border-b border-transparent focus:border-[var(--color-surface-2)]"
        />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={page.blocks.map(b => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {page.blocks.map(block => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  onUpdate={updateBlock}
                  onDelete={deleteBlock}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="mt-4 relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="font-mono text-xs text-dim hover:text-primary border border-[var(--color-surface-2)] px-3 py-1.5 rounded transition-colors"
          >
            + ADICIONAR BLOCO
          </button>
          {showAddMenu && (
            <div className="absolute top-full left-0 mt-1 bg-surface-1 border border-[var(--color-surface-2)] rounded shadow-lg z-50 min-w-[160px]">
              {BLOCK_TYPES.map(bt => (
                <button
                  key={bt.type}
                  onClick={() => addBlock(bt.type)}
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-surface-2 transition-colors font-mono text-xs text-dim text-left"
                >
                  <span className="w-4 text-center">{bt.icon}</span>
                  {bt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ShellLayout>
  );
}

function SortableBlock({ block, onUpdate, onDelete }: {
  block: BlockData;
  onUpdate: (id: string, content: any) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="relative">
        <div
          {...listeners}
          className="absolute left-0 top-1 cursor-grab active:cursor-grabbing opacity-0 hover:opacity-100 text-dim text-xs px-1"
          title="Arraste para reordenar"
        >
          ⠿
        </div>
        <div className="pl-6">
          <BlockRenderer block={block} onUpdate={onUpdate} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}
