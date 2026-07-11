'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: string;
  action: () => void;
  category: string;
}

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: Command[] = [
    // Navegação
    { id: 'nav-dashboard', label: 'Ir para Dashboard', icon: '📊', action: () => router.push('/dashboard'), category: 'Navegação' },
    { id: 'nav-hoje', label: 'Ir para Hoje', icon: '📅', action: () => router.push('/hoje'), category: 'Navegação' },
    { id: 'nav-metas', label: 'Ir para Metas', icon: '🎯', action: () => router.push('/metas'), category: 'Navegação' },
    { id: 'nav-rotinas', label: 'Ir para Rotinas', icon: '🔄', action: () => router.push('/rotinas'), category: 'Navegação' },
    { id: 'nav-calendario', label: 'Ir para Calendário', icon: '📆', action: () => router.push('/calendario'), category: 'Navegação' },
    { id: 'nav-paginas', label: 'Ir para Páginas', icon: '📄', action: () => router.push('/paginas'), category: 'Navegação' },
    { id: 'nav-databases', label: 'Ir para Databases', icon: '🗄️', action: () => router.push('/databases'), category: 'Navegação' },
    { id: 'nav-settings', label: 'Ir para Configurações', icon: '⚙️', action: () => router.push('/settings'), category: 'Navegação' },
    
    // Ações Rápidas
    { id: 'action-new-goal', label: 'Criar Nova Meta', icon: '➕', action: () => router.push('/metas?new=true'), category: 'Ações' },
    { id: 'action-new-task', label: 'Criar Nova Tarefa', icon: '✅', action: () => router.push('/hoje?new=true'), category: 'Ações' },
    { id: 'action-new-routine', label: 'Criar Nova Rotina', icon: '🔄', action: () => router.push('/rotinas?new=true'), category: 'Ações' },
    { id: 'action-new-page', label: 'Criar Nova Página', icon: '📝', action: () => router.push('/paginas?new=true'), category: 'Ações' },
    { id: 'action-new-database', label: 'Criar Novo Database', icon: '🗃️', action: () => router.push('/databases?new=true'), category: 'Ações' },
    
    // Temas
    { id: 'theme-red', label: 'Tema Vermelho', icon: '🔴', action: () => document.documentElement.setAttribute('data-theme', 'red'), category: 'Temas' },
    { id: 'theme-violet', label: 'Tema Violeta', icon: '🟣', action: () => document.documentElement.setAttribute('data-theme', 'violet'), category: 'Temas' },
    { id: 'theme-green', label: 'Tema Verde', icon: '🟢', action: () => document.documentElement.setAttribute('data-theme', 'green'), category: 'Temas' },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault();
      filteredCommands[selectedIndex].action();
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-[var(--color-surface-2)]">
          <span className="text-xl">⚡</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite um comando..."
            className="flex-1 bg-transparent text-[var(--color-text)] text-lg outline-none placeholder:text-[var(--color-text-muted)]"
          />
          <kbd className="px-2 py-1 rounded text-[10px] bg-[var(--color-surface-2)] border border-[var(--border-default)] text-[var(--color-text-dim)]">
            ESC
          </kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-[var(--color-text-dim)]">Nenhum comando encontrado</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="mb-3">
                <p className="px-3 py-1 text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-wider">
                  {category}
                </p>
                {cmds.map((cmd) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                        globalIndex === selectedIndex
                          ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                          : 'hover:bg-[var(--color-surface-2)]/50 text-[var(--color-text)]'
                      }`}
                    >
                      <span className="text-lg">{cmd.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{cmd.label}</p>
                        {cmd.description && (
                          <p className="text-xs text-[var(--color-text-muted)]">{cmd.description}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {filteredCommands.length > 0 && (
          <div className="flex items-center justify-between p-3 border-t border-[var(--color-surface-2)] text-xs text-[var(--color-text-muted)]">
            <span>{filteredCommands.length} comando{filteredCommands.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--border-default)]">↑↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--border-default)]">↵</kbd>
                executar
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}