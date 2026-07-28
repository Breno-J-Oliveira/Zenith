'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { API, apiGet } from '@/lib/api';

interface SearchResult {
  type: 'goal' | 'task' | 'routine' | 'page' | 'database' | 'appointment' | 'row';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  icon: string;
  meta?: Record<string, any>;
}

interface SearchResponse {
  query: string;
  total: number;
  byType: Record<string, number>;
  results: SearchResult[];
}

const TYPE_LABELS: Record<string, string> = {
  goal: 'Metas',
  task: 'Tarefas',
  routine: 'Rotinas',
  page: 'Páginas',
  database: 'Databases',
  appointment: 'Compromissos',
  row: 'Registros',
};

const TYPE_COLORS: Record<string, string> = {
  goal: 'text-[var(--color-primary)]',
  task: 'text-emerald-400',
  routine: 'text-cyan-400',
  page: 'text-amber-400',
  database: 'text-fuchsia-400',
  appointment: 'text-orange-400',
  row: 'text-violet-400',
};

/**
 * Destaca o termo de busca dentro de um texto (case-insensitive).
 * Retorna um array de partes (string normal + <mark>termo</mark>).
 */
function highlight(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const norm = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const q = norm(query);
  const t = norm(text);
  const idx = t.indexOf(q);
  if (idx === -1) return text;
  // Mapear idx normalizado para idx original
  let origIdx = 0;
  let normIdx = 0;
  while (origIdx < text.length && normIdx < idx) {
    // avança até encontrar o caractere correspondente
    if (norm(text[origIdx]) === t[normIdx]) {
      origIdx++;
      normIdx++;
    } else {
      origIdx++;
    }
  }
  const before = text.slice(0, origIdx);
  const matchLen = text.slice(origIdx).match(new RegExp(query, 'i'))?.[0].length || 0;
  // fallback simples
  const match = text.substring(origIdx, origIdx + matchLen || idx + query.length);
  const after = text.slice(origIdx + match.length);
  return (
    <>
      {before}
      <mark className="bg-[var(--color-primary)]/30 text-[var(--color-text)] px-0.5 rounded">
        {match}
      </mark>
      {after}
    </>
  );
}

export function GlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResponse(null);
      setSelectedIndex(0);
      setTypeFilter(null);
      loadRecentSearches();
    }
  }, [isOpen]);

  const loadRecentSearches = () => {
    const saved = localStorage.getItem('zenith_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {
        // ignore corrupt data
      }
    }
  };

  const saveRecentSearch = (search: string) => {
    if (!search) return;
    const updated = [search, ...recentSearches.filter((s) => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('zenith_recent_searches', JSON.stringify(updated));
  };

  useEffect(() => {
    if (query.length < 2) {
      setResponse(null);
      return;
    }

    const debounce = setTimeout(async () => {
      setLoading(true);
      try {
        // Usa o endpoint unificado /search do backend (Fase 11)
        const types = typeFilter ? `&types=${typeFilter}` : '';
        const data = await apiGet<SearchResponse>(`/search?q=${encodeURIComponent(query)}${types}&limit=10`);
        setResponse(data);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Erro na busca:', err);
        setResponse({ query, total: 0, byType: {}, results: [] });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, typeFilter]);

  const results = response?.results || [];
  const byType = response?.byType || {};

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
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

  // Agrupa resultados por tipo para o header
  const typeOrder: string[] = ['goal', 'task', 'routine', 'page', 'database', 'appointment', 'row'];

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
            placeholder="Buscar metas, tarefas, rotinas, páginas, databases..."
            className="flex-1 bg-transparent text-[var(--color-text)] text-lg outline-none placeholder:text-[var(--color-text-muted)]"
          />
          {loading && (
            <div className="w-5 h-5 rounded-full border-2 border-[var(--color-surface-2)] border-t-[var(--color-primary)] animate-spin" />
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] bg-[var(--color-surface-2)] border border-[var(--border-default)] text-[var(--color-text-dim)]">
            ESC
          </kbd>
        </div>

        {/* Filtro de tipo (aparece quando há resultados) */}
        {results.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-surface-2)]/50 bg-[var(--color-surface-2)]/10 overflow-x-auto">
            <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-wider">Filtrar:</span>
            <button
              onClick={() => setTypeFilter(null)}
              className={`text-[10px] font-mono uppercase px-2 py-1 rounded transition-colors ${
                !typeFilter
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
              }`}
            >
              Todos ({response?.total || 0})
            </button>
            {typeOrder
              .filter((t) => byType[t] > 0)
              .map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                  className={`text-[10px] font-mono uppercase px-2 py-1 rounded transition-colors ${
                    typeFilter === t
                      ? 'bg-[var(--color-primary)] text-white'
                      : `${TYPE_COLORS[t] || 'text-[var(--color-text-dim)]'} hover:bg-[var(--color-surface-2)]`
                  }`}
                >
                  {TYPE_LABELS[t] || t} ({byType[t]})
                </button>
              ))}
          </div>
        )}

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
                    { icon: '📅', label: 'Compromissos', desc: 'Eventos e reuniões' },
                  ].map((item) => (
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
                {response?.total} resultado{response?.total !== 1 ? 's' : ''} encontrado{response?.total !== 1 ? 's' : ''}
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
                      {highlight(result.title, query)}
                    </p>
                    {result.subtitle && (
                      <p className="text-xs text-[var(--color-text-muted)] truncate">
                        {highlight(result.subtitle, query)}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase px-2 py-1 rounded-lg bg-[var(--color-surface-2)]/50">
                    {TYPE_LABELS[result.type] || result.type}
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
