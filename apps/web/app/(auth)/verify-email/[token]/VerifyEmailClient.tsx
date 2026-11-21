'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAccountLinkToken } from '@/components/auth/useAccountLinkToken';
import { ZenithMark } from '@/components/layout/ZenithMark';

export default function VerifyEmailClient({ token: previousLinkToken }: { token?: string }) {
  const { nexusAuthUrl } = useAuth();
  const token = useAccountLinkToken(previousLinkToken);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'verified' | 'invalid' | 'mismatch' | 'error'>('idle');

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !password || status === 'sending') return;
    setStatus('sending');
    try {
      const response = await fetch(nexusAuthUrl + '/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) {
        setPassword('');
        setStatus('verified');
      } else if (response.status === 400) {
        const data = await response.json().catch(() => ({}));
        setStatus(data.code === 'VERIFICATION_PASSWORD_MISMATCH' ? 'mismatch' : 'invalid');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-12">
      <main className="card hud-border w-full max-w-md space-y-4 p-6 sm:p-8">
        <ZenithMark className="h-10 w-10 text-[var(--color-primary)]" />
        <h1 className="font-orbitron text-xl font-bold">Confirme seu e-mail</h1>
        {status === 'verified' ? (
          <>
            <p role="status">E-mail confirmado. Sua conta está pronta para entrar.</p>
            <Link href="/login/" className="btn btn-primary min-h-11 w-full">Entrar no Zenith</Link>
          </>
        ) : token === null ? (
          <p role="status">Lendo o link…</p>
        ) : !token || status === 'invalid' ? (
          <>
            <p role="alert">Este link é inválido, já foi usado ou expirou.</p>
            <Link href="/resend-verification/" className="btn btn-primary min-h-11 w-full">Solicitar novo link</Link>
          </>
        ) : (
          <form onSubmit={confirm} className="space-y-4">
            <p>Use a senha que você escolheu no cadastro para confirmar o endereço.</p>
            <div>
              <label htmlFor="verify-account-password" className="block pb-1 text-sm">Senha do cadastro</label>
              <input id="verify-account-password" type="password" autoComplete="current-password"
                required maxLength={128} className="input w-full" value={password}
                onChange={event => setPassword(event.target.value)} />
            </div>
            {status === 'error' && <p role="alert">Não foi possível confirmar agora. Tente novamente.</p>}
            {status === 'mismatch' && <p role="alert">A senha não confere. Tente novamente ou redefina sua senha.</p>}
            <button type="submit" disabled={status === 'sending'} className="btn btn-primary min-h-11 w-full">
              {status === 'sending' ? 'Confirmando…' : 'Confirmar e-mail'}
            </button>
            <Link href="/forgot-password/" className="btn btn-secondary min-h-11 w-full">Redefinir senha</Link>
          </form>
        )}
      </main>
    </div>
  );
}
