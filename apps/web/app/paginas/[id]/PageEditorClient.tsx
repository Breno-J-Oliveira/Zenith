'use client';

import { AlignLeft, Heading, ImageIcon, ListTodo, Minus, SquareCheck, Target } from 'lucide-react';
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
import { apiGet, apiPatch, apiPost, apiDelete } from '@/lib/api';

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
  { type: 'heading', label: 'Título', icon: Heading },
  { type: 'text', label: 'Texto', icon: AlignLeft },
  { type: 'todo', label: 'Lista de tarefas', icon: SquareCheck },
  { type: 'task_ref', label: 'Vincular tarefa', icon: ListTodo },
  { type: 'goal_ref', label: 'Vincular meta', icon: Target },
  { type: 'image', label: 'Imagem', icon: ImageIcon },
  { type: 'divider', label: 'Divisor', icon: Minus },
];

export default function PageEditorClient({ id }: { id: string }) {
  const [page, setPage] = useState<PageData | null>(null);
  const [title, setTitle] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchPage = useCallback(() => {
    apiGet<any>(`/pages/${id}`)
      .then(data => {
        setPage(data);
        setTitle(data.title);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const updateTitle = async () => {
    if (!page || title === page.title) return;
    await apiPatch(`/pages/${id}`, { title });
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

    const newBlock = await apiPost<any>(`/pages/${id}/blocks`, {
      type,
      content: defaultContent[type] || {},
    });
    setPage(prev => prev ? { ...prev, blocks: [...prev.blocks, newBlock] } : prev);
    setShowAddMenu(false);
  };

  const updateBlock = async (blockId: string, content: any) => {
    await apiPatch(`/pages/blocks/${blockId}`, { content });
  };

  const deleteBlock = async (blockId: string) => {
    await apiDelete(`/pages/blocks/${blockId}`);
    setPage(prev => prev ? { ...prev, blocks: prev.blocks.filter(b => b.id !== blockId) } : prev);
  };

  const handleDragEnd = async (event: any) => {
    if (!page) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = page.blocks.findIndex(b => b.id === active.id);
    const newIndex = page.blocks.findIndex(b => b.id === over.id);
    const newBlocks = arrayMove(page.blocks, oldIndex, newIndex);
    setPage({ ...page, blocks: newBlocks });

    await apiPatch('/pages/blocks/reorder', {
      blocks: newBlocks.map((b, i) => ({ id: b.id, order: i })),
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
                  <bt.icon aria-hidden="true" className="h-4 w-4 shrink-0" />
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
  onUpdate: (id: string, content: any) => Promise<void>;
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