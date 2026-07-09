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

  return (
    <ShellLayout>
      <div className="px-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-mono text-2xl text-primary">PÁGINAS</h1>
          <button
            onClick={createPage}
            className="font-mono text-xs text-primary border border-primary px-3 py-1.5 hover:bg-primary hover:text-surface-0 transition-colors"
          >
            + NOVA PÁGINA
          </button>
        </div>

        {loading ? (
          <p className="font-mono text-sm text-dim">Carregando...</p>
        ) : rootPages.length === 0 ? (
          <p className="font-mono text-sm text-dim">Nenhuma página criada ainda. Clique em "Nova Página" para começar.</p>
        ) : (
          <div className="space-y-2">
            {rootPages.map(page => (
              <PageRow key={page.id} page={page} allPages={pages} depth={0} />
            ))}
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
        className="flex items-center gap-2 py-2 hover:bg-surface-1 px-2 rounded transition-colors"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {children.length > 0 ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="font-mono text-xs text-dim hover:text-primary w-4"
          >
            {expanded ? '▼' : '▶'}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <span className="text-sm">{page.icon || '📄'}</span>
        <Link
          href={`/paginas/${page.id}`}
          className="font-mono text-sm text-dim hover:text-primary transition-colors flex-1"
        >
          {page.title}
        </Link>
        <span className="font-mono text-xs text-dim opacity-50">
          {page.blocks.length} blocos
        </span>
      </div>
      {expanded && children.length > 0 && (
        <div>
          {children.map(child => (
            <PageRow key={child.id} page={child} allPages={allPages} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
