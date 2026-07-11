'use client';

import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ChatPanel } from '../chat/ChatPanel';

export function ShellLayout({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />
      <Sidebar />
      <main className="pt-16 pl-[72px] min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Chat Toggle Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          chatOpen
            ? 'bg-[var(--color-surface-2)] text-[var(--color-text)] rotate-0'
            : 'bg-[var(--color-primary)] text-white hover:scale-110 glow'
        }`}
        title={chatOpen ? 'Fechar chat' : 'Abrir chat com IA'}
      >
        {chatOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}