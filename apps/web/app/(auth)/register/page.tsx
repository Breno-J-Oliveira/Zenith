'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authProvider, Logo } from '@zenith/shared';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await authProvider.register({ name, email, password });
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo size={64} className="text-primary mb-4" />
          <h1 className="font-orbitron text-3xl font-bold">ZENITH</h1>
          <p className="text-dim text-sm mt-2">Crie sua conta</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="font-mono text-xs text-dim block mb-1">NOME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              required
              className="w-full bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded px-4 py-3 text-white placeholder:text-dim focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-dim block mb-1">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded px-4 py-3 text-white placeholder:text-dim focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-dim block mb-1">SENHA</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[var(--color-surface-1)] border border-[var(--color-surface-2)] rounded px-4 py-3 text-white placeholder:text-dim focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white font-orbitron font-bold py-3 rounded hover:opacity-90 transition-opacity"
          >
            Create account
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-dim text-sm">
            Já tem conta?{' '}
            <a href="/login" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
