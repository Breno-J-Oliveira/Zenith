'use client';

import { useState, useEffect } from 'react';
import { ShellLayout } from '../../components/layout/ShellLayout';
import Link from 'next/link';

const API = 'http://localhost:3002';

interface PageItem {
  id: string;
  title: string;
  parentId: string | null;
  icon: string | null;
  children: string[];
  blocks: any[];
  createdAt: string;
  updatedAt: string;
}

export default function PaginasPage() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = () => {
    fetch(`${API}/pages`)
      .then(r => r.json())
      .then(data => { setPages(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchPages(); }, []);

  const createPage = async () => {
    const res = await fetch(`${API}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Nova Página' }),
    });
    const page = await res.json();
    window.location.href = `/paginas/${page.id}`;
  };

  const rootPages = pages.filter(p => !p.parentId);
  const totalPages = pages.length;
  const totalBlocks = pages.reduce((acc, p) => acc + p.blocks.length, 0);

  return (
    <ShellLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--color-violet-subtle,rgba(108,76,255,0.08))] text-[var(--color-violet,#6C4CFF)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h1 className="font-orbitron text-2xl font-bold text-[var(--color-text)]">Páginas</h1>
              <p className="text-[var(--color-text-dim)] text-sm">{totalPages} páginas · {totalBlocks} blocos</p>
            </div>
          </div>
          <button
            onClick={createPage}
            className="btn btn-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nova Página
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-full border-2 border-[var(--color-surface-2)] border-t-[var(--color-violet,#6C4CFF)] animate-spin mb-4" />
            <p className="text-[var(--color-text-dim)] text-sm">Carregando páginas...</p>
          </div>
        ) : rootPages.length === 0 ? (
          <div className="card p-12 text-center hud-border">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="font-orbitron text-lg text-[var(--color-text)] mb-2">Nenhuma página</p>
            <p className="text-[var(--color-text-dim)] text-sm mb-4">Clique em "Nova Página" para começar a organizar suas ideias.</p>
          </div>
        ) : (
          <div className="card p-4 hud-border">
            <div className="space-y-1">
              {rootPages.map(page => (
                <PageRow key={page.id} page={page} allPages={pages} depth={0} />
              ))}
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

function PageRow({ page, allPages, depth }: { page: PageItem; allPages: PageItem[]; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  const children = allPages.filter(p => p.parentId === page.id);

  return (
    <div>
      <div
        className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-[var(--color-surface-2)]/50 transition-all duration-200 group"
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {children.length > 0 ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-5 h-5 flex items-center justify-center rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-all"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ) : (
          <span className="w-5" />
        )}
        <span className="text-base">{page.icon || '📄'}</span>
        <Link
          href={`/paginas/${page.id}`}
          className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors flex-1 font-medium"
        >
          {page.title}
        </Link>
        <span className="font-mono text-[10px] text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
          {page.blocks.length} blocos
        </span>
      </div>
      {expanded && children.length > 0 && (
        <div className="animate-fade-in">
          {children.map(child => (
            <PageRow key={child.id} page={child} allPages={allPages} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}