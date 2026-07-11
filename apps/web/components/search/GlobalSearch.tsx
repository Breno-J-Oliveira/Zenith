'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://localhost:3002';

interface SearchResult {
  type: 'goal' | 'task' | 'routine' | 'page' | 'database';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

export function GlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      setLoading(true);
      try {
        const [goalsRes, tasksRes, routinesRes, pagesRes, databasesRes] = await Promise.all([
          fetch(`${API}/goals`),
          fetch(`${API}/tasks`),
          fetch(`${API}/routines`),
          fetch(`${API}/pages`),
          fetch(`${API}/databases`),
        ]);

        const goals = await goalsRes.json();
        const tasks = await tasksRes.json();
        const routines = await routinesRes.json();
        const pages = await pagesRes.json();
        const databases = await databasesRes.json();

        const q = query.toLowerCase();
        const searchResults: SearchResult[] = [];

        // Buscar metas
        if (Array.isArray(goals)) {
          goals
            .filter((g: any) => g.title.toLowerCase().includes(q))
            .forEach((g: any) => {
              searchResults.push({
                type: 'goal',
                id: g.id,
                title: g.title,
                subtitle: `${g.category} · ${g.status}`,
                href: '/metas',
              });
            });
        }

        // Buscar tarefas
        if (Array.isArray(tasks)) {
          tasks
            .filter((t: any) => t.title.toLowerCase().includes(q))
            .forEach((t: any) => {
              searchResults.push({
                type: 'task',
                id: t.id,
                title: t.title,
                subtitle: t.completed ? 'Concluída' : 'Pendente',
                href: '/hoje',
              });
            });
        }

        // Buscar rotinas
        if (Array.isArray(routines)) {
          routines
            .filter((r: any) => r.title.toLowerCase().includes(q))
            .forEach((r: any) => {
              searchResults.push({
                type: 'routine',
                id: r.id,
                title: r.title,
                subtitle: `${r.frequency} às ${r.time}`,
                href: '/rotinas',
              });
            });
        }

        // Buscar páginas
        if (Array.isArray(pages)) {
          pages
            .filter((p: any) => p.title.toLowerCase().includes(q))
            .forEach((p: any) => {
              searchResults.push({
                type: 'page',
                id: p.id,
                title: p.title,
                subtitle: `${p.blocks?.length || 0} blocos`,
                href: `/paginas/${p.id}`,
              });
            });
        }

        // Buscar databases
        if (Array.isArray(databases)) {
          databases
            .filter((d: any) => d.title.toLowerCase().includes(q))
            .forEach((d: any) => {
              searchResults.push({
                type: 'database',
                id: d.id,
                title: d.title,
                subtitle: `${d.properties?.length || 0} propriedades`,
                href: '/databases',
              });
            });
        }

        setResults(searchResults);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Erro na busca:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      router.push(results[selectedIndex].href);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'goal': return '🎯';
      case 'task': return '✅';
      case 'routine': return '🔄';
      case 'page': return '📄';
      case 'database': return '🗄️';
      default: return '📋';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--color-surface-2)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar metas, tarefas, rotinas, páginas..."
            className="flex-1 bg-transparent text-[var(--color-text)] text-lg outline-none placeholder:text-[var(--color-text-muted)]"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded text-[10px] bg-[var(--color-surface-2)] border border-[var(--border-default)] text-[var(--color-text-dim)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-[var(--color-surface-2)] border-t-[var(--color-primary)] animate-spin" />
            </div>
          ) : query.length < 2 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-[var(--color-text-dim)]">Digite pelo menos 2 caracteres para buscar</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)]">
                <div className="flex items-center gap-2 p-2 rounded bg-[var(--color-surface-2)]/30">
                  <span>🎯</span> Metas
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-[var(--color-surface-2)]/30">
                  <span>✅</span> Tarefas
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-[var(--color-surface-2)]/30">
                  <span>🔄</span> Rotinas
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-[var(--color-surface-2)]/30">
                  <span>📄</span> Páginas
                </div>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-[var(--color-text-dim)]">Nenhum resultado encontrado para "{query}"</p>
            </div>
          ) : (
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    router.push(result.href);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                    index === selectedIndex
                      ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                      : 'hover:bg-[var(--color-surface-2)]/50 text-[var(--color-text)]'
                  }`}
                >
                  <span className="text-lg">{getTypeIcon(result.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{result.subtitle}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="flex items-center justify-between p-3 border-t border-[var(--color-surface-2)] text-xs text-[var(--color-text-muted)]">
            <span>{results.length} resultado{results.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--border-default)]">↑↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--border-default)]">↵</kbd>
                abrir
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}