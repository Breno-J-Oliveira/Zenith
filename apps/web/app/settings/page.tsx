'use client';

import { useState } from 'react';
import { ShellLayout } from '../../components/ShellLayout';

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

  return (
    <ShellLayout>
      <div className="p-8 max-w-3xl">
        <h1 className="font-orbitron text-2xl font-bold mb-8">Configurações</h1>

        {/* Theme selector */}
        <div className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg p-6 mb-6">
          <h2 className="font-orbitron text-lg font-bold mb-4">Tema</h2>
          <p className="text-dim text-sm mb-4">Escolha a paleta de cores do app</p>
          <div className="flex gap-3">
            {[
              { id: 'red', label: 'Red', color: '#FF2B51' },
              { id: 'violet', label: 'Violet', color: '#6C4CFF' },
              { id: 'green', label: 'Green', color: '#00CC44' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded border transition-all ${
                  theme === t.id
                    ? 'border-[var(--color-primary)] bg-[var(--color-surface-2)]'
                    : 'border-[var(--color-surface-2)] hover:border-[var(--color-primary)]'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span className="font-mono text-xs">{t.label.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Profile form */}
        <div className="bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded-lg p-6">
          <h2 className="font-orbitron text-lg font-bold mb-4">Perfil</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="font-mono text-xs text-dim block mb-1">NOME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-surface-2)] rounded px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-dim block mb-1">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-surface-2)] rounded px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-dim block mb-1">HORÁRIO PREFERIDO</label>
              <input
                type="time"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-surface-2)] rounded px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="bg-primary text-white font-orbitron font-bold px-6 py-3 rounded hover:opacity-90 transition-opacity"
              >
                Salvar
              </button>
              {saved && (
                <span className="text-[var(--color-success)] font-mono text-sm">
                  Salvo com sucesso!
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </ShellLayout>
  );
}
