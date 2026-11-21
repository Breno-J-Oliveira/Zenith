'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ChatPanel } from '../chat/ChatPanel';

export function ShellLayout({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <a href="#zenith-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-[var(--color-surface-1)] focus:px-4 focus:py-3">
        Ir para o conteúdo
      </a>
      <Header />
      <Sidebar />
      <main id="zenith-main" tabIndex={-1}
        className="min-h-screen px-4 pt-20 pb-[calc(8rem+env(safe-area-inset-bottom))] sm:px-6 md:ml-52 md:px-8 md:pt-24 md:pb-24">
        {children}
      </main>
      <button type="button" onClick={() => setChatOpen(open => !open)}
        title={chatOpen ? 'Fechar chat' : 'Abrir chat com IA'} aria-expanded={chatOpen}
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 grid h-11 w-11 place-items-center rounded-full border border-[var(--color-surface-4)] bg-[var(--color-surface-1)] text-[var(--color-text)] shadow-md hover:border-[var(--color-primary)] md:bottom-6 md:right-6">
        {chatOpen ? <X size={19} aria-hidden="true" /> : <MessageCircle size={19} aria-hidden="true" />}
      </button>
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
