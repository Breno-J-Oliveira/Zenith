'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Logo } from '@zenith/shared';
import { useAuth } from '../auth/AuthProvider';
import { GlobalSearch } from '../search/GlobalSearch';
import { CommandPalette } from '../command/CommandPalette';
import { NotificationPanel } from '../notifications/NotificationPanel';

export function Header() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K para busca
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      // Ctrl/Cmd + Shift + P para command palette
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fecha menu do user ao clicar fora
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--color-surface-1)]/95 backdrop-blur-md border-b border-[var(--color-surface-2)] flex items-center justify-between px-6 z-50 header-hud">
        <Link href={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3 group">
          <div className="relative">
            <Logo size={32} className="text-[var(--color-primary)] transition-all duration-300 group-hover:drop-shadow-[0_0_8px_var(--color-primary)]" />
          </div>
          <span className="font-orbitron text-xl font-bold tracking-wider">
            <span className="text-[var(--color-primary)]">Z</span>
            <span className="text-[var(--color-text)]">ENITH</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <>
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)]/50 border border-[var(--color-surface-2)] text-[var(--color-text-dim)] text-sm hover:border-[var(--color-primary)]/50 hover:text-[var(--color-text)] transition-all duration-200"
                title="Buscar (Ctrl+K)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="hidden sm:inline">Buscar...</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-bg)] border border-[var(--color-surface-2)] text-[var(--color-text-dim)]">
                  ⌘K
                </kbd>
              </button>

              <button
                onClick={() => setCommandOpen(true)}
                className="p-2 rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]/50 transition-all duration-200"
                title="Command Palette (Ctrl+Shift+P)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 17 10 11 4 5" />
                  <line x1="12" y1="19" x2="20" y2="19" />
                </svg>
              </button>

              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]/50 transition-all duration-200"
                title="Notificações"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-primary)]" />
              </button>
            </>
          )}

          <Link
            href="/settings"
            className="p-2 rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]/50 transition-all duration-200"
            title="Configurações"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>

          {/* User menu / Login */}
          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[var(--color-surface-2)]/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-alt)] flex items-center justify-center text-white text-sm font-bold">
                  {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline text-sm text-[var(--color-text)]">{user.name || user.email.split('@')[0]}</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg shadow-2xl overflow-hidden animate-slide-in-up z-50">
                  <div className="p-3 border-b border-[var(--color-surface-2)]">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">
                      {user.name || 'Sem nome'}
                    </p>
                    <p className="text-xs text-[var(--color-text-dim)] truncate">{user.email}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-1">
                      {user.role} • {user.id.substring(0, 8)}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-3 py-2 text-sm text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)]/50 hover:text-[var(--color-text)]"
                    >
                      ⚙️ Configurações
                    </Link>
                    <button
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await logout();
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-surface-2)]/50"
                    >
                      🚪 Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : !loading ? (
            <Link
              href="/login"
              className="btn btn-primary text-sm"
            >
              Entrar
            </Link>
          ) : null}
        </div>
      </header>

      {isAuthenticated && (
        <>
          <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
          <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />
          <NotificationPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
        </>
      )}
    </>
  );
}
