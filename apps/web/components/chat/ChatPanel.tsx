'use client';

import { useState, useEffect, useRef } from 'react';

const API = 'http://localhost:3002';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: string;
  createdAt: string;
}

interface Thread {
  id: string;
  title: string;
  messages: Message[];
  _count: { messages: number };
}

export function ChatPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showThreads, setShowThreads] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchThreads();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [activeThread?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchThreads = async () => {
    try {
      const res = await fetch(`${API}/chat/threads`);
      const data = await res.json();
      setThreads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar threads:', err);
    }
  };

  const createThread = async () => {
    try {
      const res = await fetch(`${API}/chat/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Nova conversa' }),
      });
      const thread = await res.json();
      setActiveThread({ ...thread, messages: [], _count: { messages: 0 } });
      setShowThreads(false);
      fetchThreads();
    } catch (err) {
      console.error('Erro ao criar thread:', err);
    }
  };

  const selectThread = async (thread: Thread) => {
    try {
      const res = await fetch(`${API}/chat/threads/${thread.id}`);
      const data = await res.json();
      setActiveThread(data);
      setShowThreads(false);
    } catch (err) {
      console.error('Erro ao carregar thread:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    if (!activeThread) {
      await createThread();
      return;
    }

    const content = input;
    setInput('');
    setLoading(true);

    const tempUserMsg: Message = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setActiveThread(prev => prev ? {
      ...prev,
      messages: [...prev.messages, tempUserMsg],
    } : null);

    try {
      const res = await fetch(`${API}/chat/threads/${activeThread.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();

      setActiveThread(prev => prev ? {
        ...prev,
        messages: [...prev.messages.filter(m => m.id !== tempUserMsg.id), data.userMessage, data.assistantMessage],
      } : null);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[500px] bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--color-surface-2)] bg-[var(--color-surface-2)]/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--color-text)]">Zenith IA</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">Assistente pessoal</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowThreads(!showThreads)}
            className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
            title="Conversas"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {showThreads ? (
        /* Threads List */
        <div className="flex-1 overflow-y-auto p-3">
          <button
            onClick={createThread}
            className="w-full p-3 rounded-lg border border-dashed border-[var(--border-default)] hover:border-[var(--color-primary)]/50 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-primary)] transition-all mb-3"
          >
            + Nova conversa
          </button>
          {threads.length === 0 ? (
            <p className="text-center text-xs text-[var(--color-text-muted)] py-8">
              Nenhuma conversa ainda. Crie uma para começar!
            </p>
          ) : (
            <div className="space-y-2">
              {threads.map(thread => (
                <button
                  key={thread.id}
                  onClick={() => selectThread(thread)}
                  className="w-full p-3 rounded-lg bg-[var(--color-surface-2)]/30 hover:bg-[var(--color-surface-2)] text-left transition-all"
                >
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">{thread.title}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{thread._count.messages} mensagens</p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : activeThread ? (
        /* Messages */
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {activeThread.messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-[var(--color-text-dim)] mb-2">👋 Olá! Como posso ajudar?</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Digite "ajuda" para ver os comandos
                </p>
              </div>
            )}
            {activeThread.messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text)]'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.toolCalls && (
                    <div className="mt-1 pt-1 border-t border-white/20 text-[10px] opacity-70">
                      🔧 Ferramentas usadas
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[var(--color-surface-2)] rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-text-dim)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[var(--color-text-dim)] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[var(--color-text-dim)] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[var(--color-surface-2)]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="input flex-1 text-sm"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="btn btn-primary px-3"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}