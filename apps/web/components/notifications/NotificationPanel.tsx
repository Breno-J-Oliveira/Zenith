'use client';

import { useState, useEffect } from 'react';

const API = 'http://localhost:3002';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  relatedType?: string;
  relatedId?: string;
  createdAt: string;
}

export function NotificationPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Mock: gerar notificações de exemplo
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Bem-vindo ao Zenith!',
          body: 'Comece criando sua primeira meta ou rotina. Use o chat com IA para ajuda.',
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Rotina concluída',
          body: 'Você completou a rotina "Meditar" hoje. Continue assim!',
          type: 'success',
          read: false,
          relatedType: 'routine',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          title: 'Lembrete: Reunião',
          body: 'Sua reunião começa em 30 minutos. Prepare seus materiais.',
          type: 'warning',
          read: true,
          relatedType: 'appointment',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: '4',
          title: 'Meta atingida',
          body: 'Parabéns! Você completou 80% da meta "Aprender React".',
          type: 'success',
          read: true,
          relatedType: 'goal',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '5',
          title: 'Nova atualização',
          body: 'O Zenith foi atualizado com novas funcionalidades. Confira!',
          type: 'info',
          read: true,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ];
      setNotifications(mockNotifications);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-[var(--color-success-glow)] text-[var(--color-success)] border-[var(--color-success)]/30';
      case 'warning': return 'bg-[var(--color-warning-glow)] text-[var(--color-warning)] border-[var(--color-warning)]/30';
      case 'error': return 'bg-[var(--color-danger-glow)] text-[var(--color-danger)] border-[var(--color-danger)]/30';
      default: return 'bg-[var(--color-info-glow)] text-[var(--color-info)] border-[var(--color-info)]/30';
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diff = now.getTime() - notificationDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return notificationDate.toLocaleDateString('pt-BR');
  };

  if (!isOpen) return null;

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed top-16 right-4 z-50 w-96 max-h-[600px] bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-surface-2)] bg-gradient-to-r from-[var(--color-surface-2)]/30 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-warning-glow)] text-[var(--color-warning)] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div>
            <h3 className="font-orbitron text-sm font-bold text-[var(--color-text)]">Notificações</h3>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}` : 'Tudo em dia'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-primary)] transition-colors px-2 py-1 rounded-lg hover:bg-[var(--color-surface-2)]/50"
            >
              Marcar todas
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-2 border-b border-[var(--color-surface-2)] bg-[var(--color-surface-2)]/20">
        {[
          { key: 'all', label: 'Todas', count: notifications.length },
          { key: 'unread', label: 'Não lidas', count: unreadCount },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === tab.key
                ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]/50'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1 text-[10px] opacity-70">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-[450px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-surface-2)] border-t-[var(--color-primary)] animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <p className="text-sm text-[var(--color-text-dim)] mb-1">
              {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {filter === 'unread' ? 'Você está em dia!' : 'Volte mais tarde'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`p-4 hover:bg-[var(--color-surface-2)]/30 transition-all cursor-pointer group ${
                  !notification.read ? 'bg-[var(--color-primary-subtle)]' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border ${getTypeColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-medium truncate ${!notification.read ? 'text-[var(--color-text)]' : 'text-[var(--color-text-dim)]'}`}>
                        {notification.title}
                      </p>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-all"
                          title="Excluir"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 mb-2">
                      {notification.body}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        {formatTime(notification.createdAt)}
                      </p>
                      {notification.relatedType && (
                        <span className="text-[9px] font-mono text-[var(--color-text-muted)] uppercase px-1.5 py-0.5 rounded bg-[var(--color-surface-2)]/50">
                          {notification.relatedType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center justify-between p-3 border-t border-[var(--color-surface-2)] bg-[var(--color-surface-2)]/20">
          <span className="text-xs text-[var(--color-text-muted)]">
            {filteredNotifications.length} notificação{filteredNotifications.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onClose}
            className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-primary)] transition-colors"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}