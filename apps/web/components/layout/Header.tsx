'use client';

import Link from 'next/link';
import { Logo } from '@zenith/shared';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--color-surface-1)]/95 backdrop-blur-md border-b border-[var(--color-surface-2)] flex items-center justify-between px-6 z-50 header-hud">
      {/* Logo e nome */}
      <Link href="/dashboard" className="flex items-center gap-3 group">
        <div className="relative">
          <Logo size={32} className="text-[var(--color-primary)] transition-all duration-300 group-hover:drop-shadow-[0_0_8px_var(--color-primary)]" />
        </div>
        <span className="font-orbitron text-xl font-bold tracking-wider">
          <span className="text-[var(--color-primary)]">Z</span>
          <span className="text-[var(--color-text)]">ENITH</span>
        </span>
      </Link>

      {/* Ações à direita */}
      <div className="flex items-center gap-2">
        {/* Busca rápida */}
        <button
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

        {/* Configurações */}
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

        {/* Perfil */}
        <Link
          href="/settings"
          className="p-2 rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]/50 transition-all duration-200"
          title="Perfil"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Link>
      </div>
    </header>
  );
}