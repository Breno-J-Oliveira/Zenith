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
          body: 'Comece criando sua primeira meta ou rotina.',
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Rotina concluída',
          body: 'Você completou a rotina "Meditar" hoje.',
          type: 'success',
          read: false,
          relatedType: 'routine',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          title: 'Lembrete: Reunião',
          body: 'Sua reunião começa em 30 minutos.',
          type: 'warning',
          read: true,
          relatedType: 'appointment',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
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
      case 'success': return 'bg-[var(--color-success-glow)] text-[var(--color-success)]';
      case 'warning': return 'bg-[var(--color-warning-glow)] text-[var(--color-warning)]';
      case 'error': return 'bg-[var(--color-danger-glow)] text-[var(--color-danger)]';
      default: return 'bg-[var(--color-info-glow)] text-[var(--color-info)]';
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diff = now.getTime() - notificationDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed top-16 right-4 z-50 w-96 max-h-[500px] bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-surface-2)]">
        <div className="flex items-center gap-2">
          <h3 className="font-orbitron text-sm font-bold text-[var(--color-text)]">Notificações</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary)] text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-primary)] transition-colors"
            >
              Marcar todas como lidas
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-[var(--color-surface-2)] border-t-[var(--color-primary)] animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-[var(--color-text-dim)]">Nenhuma notificação</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`p-4 hover:bg-[var(--color-surface-2)]/30 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-[var(--color-primary-subtle)]' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${getTypeColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-medium truncate ${!notification.read ? 'text-[var(--color-text)]' : 'text-[var(--color-text-dim)]'}`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">{notification.body}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{formatTime(notification.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}