'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { ZenithMark } from '@/components/layout/ZenithMark';

const messages = {
  reset: {
    path: '/auth/forgot-password',
    title: 'Recuperar senha',
    description: 'Informe o e-mail da sua conta para pedir um link de redefinição.',
  },
  verification: {
    path: '/auth/resend-verification',
    title: 'Reenviar confirmação',
    description: 'Informe o e-mail que você usou no cadastro.',
  },
};

export function RequestAccountLink({ kind }: { kind: keyof typeof messages }) {
  const { nexusAuthUrl } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error' | 'limited'>('idle');
  const { path, title, description } = messages[kind];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    try {
      const response = await fetch(nexusAuthUrl + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status === 429) setStatus('limited');
      else setStatus(response.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-12">
      <main className="card hud-border w-full max-w-md space-y-4 p-6 sm:p-8">
        <ZenithMark className="h-10 w-10 text-[var(--color-primary)]" />
        <h1 className="font-orbitron text-xl font-bold">{title}</h1>
        {status === 'sent' ? (
          <p role="status">Se o endereço estiver elegível, você receberá as instruções. Confira também a pasta de spam.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-[var(--color-text-secondary)]">{description}</p>
            <div>
              <label htmlFor="account-link-email" className="block pb-1 text-sm">E-mail</label>
              <input id="account-link-email" type="email" className="input w-full" required
                autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} />
            </div>
            {status === 'error' && <p role="alert">Não foi possível concluir a solicitação. Tente novamente.</p>}
            {status === 'limited' && <p role="alert">Muitas solicitações. Aguarde alguns minutos e tente novamente.</p>}
            <button type="submit" disabled={status === 'sending'} className="btn btn-primary min-h-11 w-full">
              {status === 'sending' ? 'Solicitando…' : 'Solicitar link'}
            </button>
          </form>
        )}
        <Link href="/login/" className="btn btn-secondary min-h-11 w-full">Voltar ao login</Link>
      </main>
    </div>
  );
}
