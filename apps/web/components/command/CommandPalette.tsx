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
  shortcut?: string;
}

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: Command[] = [
    // Navegação
    { id: 'nav-dashboard', label: 'Ir para Dashboard', icon: '📊', action: () => router.push('/dashboard'), category: 'Navegação', shortcut: '⌘1' },
    { id: 'nav-hoje', label: 'Ir para Hoje', icon: '📅', action: () => router.push('/hoje'), category: 'Navegação', shortcut: '⌘2' },
    { id: 'nav-metas', label: 'Ir para Metas', icon: '🎯', action: () => router.push('/metas'), category: 'Navegação', shortcut: '⌘3' },
    { id: 'nav-rotinas', label: 'Ir para Rotinas', icon: '🔄', action: () => router.push('/rotinas'), category: 'Navegação', shortcut: '⌘4' },
    { id: 'nav-calendario', label: 'Ir para Calendário', icon: '📆', action: () => router.push('/calendario'), category: 'Navegação', shortcut: '⌘5' },
    { id: 'nav-paginas', label: 'Ir para Páginas', icon: '📄', action: () => router.push('/paginas'), category: 'Navegação', shortcut: '⌘6' },
    { id: 'nav-databases', label: 'Ir para Databases', icon: '🗄️', action: () => router.push('/databases'), category: 'Navegação', shortcut: '⌘7' },
    { id: 'nav-settings', label: 'Ir para Configurações', icon: '⚙️', action: () => router.push('/settings'), category: 'Navegação', shortcut: '⌘,' },
    
    // Ações Rápidas
    { id: 'action-new-goal', label: 'Criar Nova Meta', description: 'Definir novo objetivo', icon: '➕', action: () => router.push('/metas?new=true'), category: 'Ações' },
    { id: 'action-new-task', label: 'Criar Nova Tarefa', description: 'Adicionar tarefa pendente', icon: '✅', action: () => router.push('/hoje?new=true'), category: 'Ações' },
    { id: 'action-new-routine', label: 'Criar Nova Rotina', description: 'Configurar hábito', icon: '🔄', action: () => router.push('/rotinas?new=true'), category: 'Ações' },
    { id: 'action-new-page', label: 'Criar Nova Página', description: 'Escrever notas', icon: '📝', action: () => router.push('/paginas?new=true'), category: 'Ações' },
    { id: 'action-new-database', label: 'Criar Novo Database', description: 'Base de dados flexível', icon: '🗃️', action: () => router.push('/databases?new=true'), category: 'Ações' },
    { id: 'action-open-chat', label: 'Abrir Chat com IA', description: 'Conversar com assistente', icon: '💬', action: () => document.querySelector('[title="Abrir chat com IA"]')?.click(), category: 'Ações' },
    { id: 'action-open-search', label: 'Abrir Busca Global', description: 'Buscar em todo o app', icon: '🔍', action: () => document.querySelector('[title="Buscar (Ctrl+K)"]')?.click(), category: 'Ações' },
    
    // Temas
    { id: 'theme-red', label: 'Tema Vermelho', description: 'Energia e paixão', icon: '🔴', action: () => document.documentElement.setAttribute('data-theme', 'red'), category: 'Temas' },
    { id: 'theme-violet', label: 'Tema Violeta', description: 'Criatividade e foco', icon: '🟣', action: () => document.documentElement.setAttribute('data-theme', 'violet'), category: 'Temas' },
    { id: 'theme-green', label: 'Tema Verde', description: 'Crescimento e equilíbrio', icon: '🟢', action: () => document.documentElement.setAttribute('data-theme', 'green'), category: 'Temas' },
    
    // Visualização
    { id: 'view-fullscreen', label: 'Tela Cheia', description: 'Modo imersivo', icon: '⛶', action: () => document.documentElement.requestFullscreen?.(), category: 'Visualização' },
    { id: 'view-refresh', label: 'Recarregar Página', description: 'Atualizar dados', icon: '🔄', action: () => window.location.reload(), category: 'Visualização' },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description?.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

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
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up">
        {/* Input */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--color-surface-2)]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-alt)] text-white flex items-center justify-center shadow-glow">
            <span className="text-xl">⚡</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite um comando..."
            className="flex-1 bg-transparent text-[var(--color-text)] text-lg outline-none placeholder:text-[var(--color-text-muted)]"
          />
          <kbd className="px-2 py-1 rounded-lg text-[10px] bg-[var(--color-surface-2)] border border-[var(--border-default)] text-[var(--color-text-dim)]">
            ESC
          </kbd>
        </div>

        {/* Commands */}
        <div className="max-h-[450px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <p className="text-sm text-[var(--color-text-dim)] mb-1">
                Nenhum comando encontrado
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Tente buscar por "{query}"
              </p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="mb-3">
                <p className="px-3 py-2 text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                  {category}
                  <span className="text-[var(--color-text-muted)]">({cmds.length})</span>
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
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                        globalIndex === selectedIndex
                          ? 'bg-[var(--color-primary-subtle)] border border-[var(--color-primary)]/30'
                          : 'hover:bg-[var(--color-surface-2)]/50 border border-transparent'
                      }`}
                    >
                      <span className="text-2xl">{cmd.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text)]">
                          {cmd.label}
                        </p>
                        {cmd.description && (
                          <p className="text-xs text-[var(--color-text-muted)] truncate">
                            {cmd.description}
                          </p>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className="px-2 py-1 rounded-lg text-[10px] bg-[var(--color-surface-2)] border border-[var(--border-default)] text-[var(--color-text-dim)] font-mono">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {filteredCommands.length > 0 && (
          <div className="flex items-center justify-between p-3 border-t border-[var(--color-surface-2)] bg-[var(--color-surface-2)]/20">
            <span className="text-xs text-[var(--color-text-muted)]">
              {filteredCommands.length} comando{filteredCommands.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--border-default)]">↑↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--border-default)]">↵</kbd>
                executar
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