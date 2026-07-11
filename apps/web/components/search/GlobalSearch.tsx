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
  icon: string;
}

export function GlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      loadRecentSearches();
    }
  }, [isOpen]);

  const loadRecentSearches = () => {
    const saved = localStorage.getItem('zenith_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  const saveRecentSearch = (search: string) => {
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('zenith_recent_searches', JSON.stringify(updated));
  };

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
                icon: '🎯',
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
                subtitle: t.completed ? '✅ Concluída' : '⏳ Pendente',
                href: '/hoje',
                icon: '✅',
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
                icon: '🔄',
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
                icon: '📄',
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
                icon: '🗄️',
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
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        saveRecentSearch(query);
        router.push(results[selectedIndex].href);
        onClose();
      } else if (query.length >= 2) {
        saveRecentSearch(query);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleRecentClick = (search: string) => {
    setQuery(search);
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('zenith_recent_searches');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up">
        {/* Input */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--color-surface-2)]">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar metas, tarefas, rotinas, páginas..."
            className="flex-1 bg-transparent text-[var(--color-text)] text-lg outline-none placeholder:text-[var(--color-text-muted)]"
          />
          {loading && (
            <div className="w-5 h-5 rounded-full border-2 border-[var(--color-surface-2)] border-t-[var(--color-primary)] animate-spin" />
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] bg-[var(--color-surface-2)] border border-[var(--border-default)] text-[var(--color-text-dim)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[450px] overflow-y-auto">
          {query.length < 2 ? (
            <div className="p-6">
              {recentSearches.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-wider">
                      Buscas recentes
                    </p>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-danger)] transition-colors"
                    >
                      Limpar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentClick(search)}
                        className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)]/50 hover:bg-[var(--color-primary-subtle)] text-sm text-[var(--color-text-dim)] hover:text-[var(--color-primary)] transition-all"
                      >
                        <span className="mr-1">🔍</span>
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                  Buscar por
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { icon: '🎯', label: 'Metas', desc: 'Objetivos e marcos' },
                    { icon: '✅', label: 'Tarefas', desc: 'Itens pendentes' },
                    { icon: '🔄', label: 'Rotinas', desc: 'Hábitos diários' },
                    { icon: '📄', label: 'Páginas', desc: 'Notas e documentos' },
                    { icon: '🗄️', label: 'Databases', desc: 'Bases de dados' },
                    { icon: '📅', label: 'Calendário', desc: 'Eventos e compromissos' },
                  ].map(item => (
                    <div
                      key={item.label}
                      className="p-3 rounded-lg bg-[var(--color-surface-2)]/30 border border-[var(--border-subtle)]"
                    >
                      <span className="text-xl">{item.icon}</span>
                      <p className="text-sm font-medium text-[var(--color-text)] mt-1">{item.label}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-sm text-[var(--color-text-dim)] mb-1">
                Nenhum resultado encontrado
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Tente buscar por "{query}"
              </p>
            </div>
          ) : (
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-wider">
                {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    saveRecentSearch(query);
                    router.push(result.href);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    index === selectedIndex
                      ? 'bg-[var(--color-primary-subtle)] border border-[var(--color-primary)]/30'
                      : 'hover:bg-[var(--color-surface-2)]/50 border border-transparent'
                  }`}
                >
                  <span className="text-2xl">{result.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">
                      {result.title}
                    </p>
                    {result.subtitle && (
                      <p className="text-xs text-[var(--color-text-muted)] truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase px-2 py-1 rounded-lg bg-[var(--color-surface-2)]/50">
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="flex items-center justify-between p-3 border-t border-[var(--color-surface-2)] bg-[var(--color-surface-2)]/20">
            <span className="text-xs text-[var(--color-text-muted)]">
              {results.length} resultado{results.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--border-default)]">↑↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--border-default)]">↵</kbd>
                abrir
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--border-default)]">esc</kbd>
                fechar
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}