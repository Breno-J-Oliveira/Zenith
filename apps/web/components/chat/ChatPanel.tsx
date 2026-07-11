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

  const deleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Excluir esta conversa?')) return;
    
    try {
      await fetch(`${API}/chat/threads/${threadId}`, { method: 'DELETE' });
      if (activeThread?.id === threadId) {
        setActiveThread(null);
        setShowThreads(true);
      }
      fetchThreads();
    } catch (err) {
      console.error('Erro ao excluir thread:', err);
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

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const parseToolCalls = (toolCalls?: string) => {
    if (!toolCalls) return [];
    try {
      return JSON.parse(toolCalls);
    } catch {
      return [];
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[550px] bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-up">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--color-surface-2)] bg-gradient-to-r from-[var(--color-surface-2)]/30 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-alt)] text-white flex items-center justify-center shadow-glow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--color-text)]">Zenith IA</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {activeThread ? activeThread.title : 'Assistente pessoal'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowThreads(!showThreads)}
            className={`p-1.5 rounded transition-colors ${
              showThreads 
                ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]' 
                : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
            }`}
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
            className="w-full p-3 rounded-lg border-2 border-dashed border-[var(--border-default)] hover:border-[var(--color-primary)]/50 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-primary)] transition-all mb-3 group"
          >
            <span className="group-hover:scale-110 inline-block transition-transform">+</span> Nova conversa
          </button>
          {threads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-sm text-[var(--color-text-dim)] mb-1">Nenhuma conversa ainda</p>
              <p className="text-xs text-[var(--color-text-muted)]">Crie uma para começar!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {threads.map(thread => (
                <div
                  key={thread.id}
                  onClick={() => selectThread(thread)}
                  className={`w-full p-3 rounded-lg text-left transition-all group cursor-pointer ${
                    activeThread?.id === thread.id
                      ? 'bg-[var(--color-primary-subtle)] border border-[var(--color-primary)]/30'
                      : 'bg-[var(--color-surface-2)]/30 hover:bg-[var(--color-surface-2)] border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate flex-1">
                      {thread.title}
                    </p>
                    <button
                      onClick={(e) => deleteThread(thread.id, e)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-all"
                      title="Excluir"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    {thread._count.messages} {thread._count.messages === 1 ? 'mensagem' : 'mensagens'}
                  </p>
                </div>
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--color-primary-subtle)] to-transparent flex items-center justify-center">
                  <span className="text-3xl">👋</span>
                </div>
                <p className="text-sm text-[var(--color-text)] mb-2">Olá! Como posso ajudar?</p>
                <p className="text-xs text-[var(--color-text-muted)] mb-4">
                  Experimente estes comandos:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { cmd: 'ajuda', desc: 'Ver comandos' },
                    { cmd: 'listar metas', desc: 'Ver suas metas' },
                    { cmd: 'criar tarefa: ...', desc: 'Criar tarefa' },
                    { cmd: 'resumo do dia', desc: 'Ver resumo' },
                  ].map(suggestion => (
                    <button
                      key={suggestion.cmd}
                      onClick={() => setInput(suggestion.cmd)}
                      className="p-2 rounded-lg bg-[var(--color-surface-2)]/50 hover:bg-[var(--color-primary-subtle)] text-left transition-all group"
                    >
                      <p className="text-[var(--color-primary)] font-mono group-hover:font-bold transition-all">
                        {suggestion.cmd}
                      </p>
                      <p className="text-[var(--color-text-muted)] text-[10px]">{suggestion.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {activeThread.messages.map((msg, index) => {
              const tools = parseToolCalls(msg.toolCalls);
              return (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-alt)] text-white rounded-br-md'
                          : 'bg-[var(--color-surface-2)] text-[var(--color-text)] rounded-bl-md'
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    </div>
                    {tools.length > 0 && (
                      <div className={`mt-1 px-3 py-1.5 rounded-lg text-[10px] ${
                        msg.role === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        <span className="inline-flex items-center gap-1 text-[var(--color-text-muted)]">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                          </svg>
                          {tools.map((t: any) => t.name).join(', ')}
                        </span>
                      </div>
                    )}
                    <p className={`text-[9px] text-[var(--color-text-muted)] mt-1 ${
                      msg.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-[var(--color-surface-2)] rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[var(--color-surface-2)] bg-[var(--color-surface-2)]/20">
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
                className="btn btn-primary px-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p className="text-[9px] text-[var(--color-text-muted)] mt-2 text-center">
              Pressione Enter para enviar · Shift+Enter para nova linha
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}