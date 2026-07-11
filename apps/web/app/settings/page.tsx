'use client';

import { useState } from 'react';
import { ShellLayout } from '../../components/layout/ShellLayout';

export default function SettingsPage() {
  const [theme, setTheme] = useState('red');
  const [name, setName] = useState('mock-user');
  const [email, setEmail] = useState('mock-user@zenith.app');
  const [schedule, setSchedule] = useState('08:00');
  const [saved, setSaved] = useState(false);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const themes = [
    { id: 'red', label: 'Red', color: '#FF2B51', description: 'Energia e paixão' },
    { id: 'violet', label: 'Violet', color: '#6C4CFF', description: 'Criatividade e foco' },
    { id: 'green', label: 'Green', color: '#00CC44', description: 'Crescimento e equilíbrio' },
  ];

  return (
    <ShellLayout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <div>
            <h1 className="font-orbitron text-2xl font-bold text-[var(--color-text)]">Configurações</h1>
            <p className="text-[var(--color-text-dim)] text-sm">Personalize sua experiência</p>
          </div>
        </div>

        {/* Theme selector */}
        <div className="card p-6 mb-6 hud-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-1.5 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </div>
            <div>
              <h2 className="font-orbitron text-lg font-bold text-[var(--color-text)]">Tema</h2>
              <p className="text-[var(--color-text-dim)] text-sm">Escolha a paleta de cores do app</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-200 text-left
                  ${theme === t.id
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
                    : 'border-[var(--border-default)] hover:border-[var(--border-strong)] bg-[var(--color-surface-2)]/30'
                  }
                `}
              >
                {/* Selected indicator */}
                {theme === t.id && (
                  <div className="absolute top-2 right-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-8 h-8 rounded-full shadow-lg"
                    style={{
                      backgroundColor: t.color,
                      boxShadow: theme === t.id ? `0 0 12px ${t.color}40` : 'none'
                    }}
                  />
                  <div>
                    <p className="font-orbitron text-sm font-bold text-[var(--color-text)]">{t.label}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{t.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Profile form */}
        <div className="card p-6 hud-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-1.5 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2 className="font-orbitron text-lg font-bold text-[var(--color-text)]">Perfil</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider block mb-2">NOME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input w-full"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider block mb-2">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider block mb-2">HORÁRIO PREFERIDO</label>
              <input
                type="time"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="input w-full"
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button type="submit" className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Salvar alterações
              </button>
              {saved && (
                <div className="flex items-center gap-2 text-[var(--color-success)] animate-fade-in">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-sm font-medium">Salvo com sucesso!</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Info card */}
        <div className="card p-4 mt-6 border-[var(--border-subtle)] bg-[var(--color-surface-1)]/50">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-[var(--color-info-glow)] text-[var(--color-info)] shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                <strong className="text-[var(--color-text)]">Autenticação mockada</strong> — Esta é uma versão de desenvolvimento. 
                A autenticação real será implementada na Fase 13 do roadmap.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}