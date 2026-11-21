'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAccountLinkToken } from '@/components/auth/useAccountLinkToken';
import { ZenithMark } from '@/components/layout/ZenithMark';

export default function VerifyEmailClient({ token: previousLinkToken }: { token?: string }) {
  const { nexusAuthUrl } = useAuth();
  const token = useAccountLinkToken(previousLinkToken);
  const [status, setStatus] = useState<'idle' | 'sending' | 'verified' | 'invalid' | 'error'>('idle');

  async function confirm() {
    if (!token || status === 'sending') return;
    setStatus('sending');
    try {
      const response = await fetch(nexusAuthUrl + '/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        signal: AbortSignal.timeout(10_000),
      });
      setStatus(response.ok ? 'verified' : response.status === 400 ? 'invalid' : 'error');
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
          <>
            <p>Confirme o endereço para liberar o acesso à sua conta.</p>
            {status === 'error' && <p role="alert">Não foi possível confirmar agora. Tente novamente.</p>}
            <button type="button" onClick={confirm} disabled={status === 'sending'} className="btn btn-primary min-h-11 w-full">
              {status === 'sending' ? 'Confirmando…' : 'Confirmar e-mail'}
            </button>
          </>
        )}
      </main>
    </div>
  );
}
