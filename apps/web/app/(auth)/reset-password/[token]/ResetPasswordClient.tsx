'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAccountLinkToken } from '@/components/auth/useAccountLinkToken';
import { ZenithMark } from '@/components/layout/ZenithMark';

export default function ResetPasswordClient({ token: previousLinkToken }: { token?: string }) {
  const { nexusAuthUrl } = useAuth();
  const token = useAccountLinkToken(previousLinkToken);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'invalid'>('idle');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || status === 'saving') return;
    if (password !== confirmation) {
      setError('As senhas precisam ser iguais.');
      return;
    }
    setError('');
    setStatus('saving');
    try {
      const response = await fetch(nexusAuthUrl + '/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
        signal: AbortSignal.timeout(15_000),
      });
      if (response.ok) {
        setPassword('');
        setConfirmation('');
        setStatus('saved');
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (typeof data.code === 'string' && /^(INVALID_RESET_TOKEN|RESET_TOKEN_)/.test(data.code)) {
        setStatus('invalid');
        return;
      }
      setError(data.code === 'PASSWORD_IN_HISTORY'
        ? 'Escolha uma senha diferente das últimas que você usou.'
        : response.status === 400 ? 'Confira os requisitos da senha e tente novamente.'
        : 'Não foi possível salvar agora. Tente novamente.');
    } catch {
      setError('Não foi possível salvar agora. Tente novamente.');
    }
    setStatus('idle');
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-12">
      <main className="card hud-border w-full max-w-md space-y-4 p-6 sm:p-8">
        <ZenithMark className="h-10 w-10 text-[var(--color-primary)]" />
        <h1 className="font-orbitron text-xl font-bold">Redefina sua senha</h1>
        {status === 'saved' ? (
          <>
            <p role="status">Senha alterada. Entre com sua nova senha.</p>
            <Link href="/login/" className="btn btn-primary min-h-11 w-full">Entrar no Zenith</Link>
          </>
        ) : token === null ? (
          <p role="status">Lendo o link…</p>
        ) : !token || status === 'invalid' ? (
          <>
            <p role="alert">Este link é inválido, já foi usado ou expirou.</p>
            <Link href="/forgot-password/" className="btn btn-primary min-h-11 w-full">Solicitar novo link</Link>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p id="new-password-hint" className="text-sm text-[var(--color-text-secondary)]">
              Use pelo menos 8 caracteres, com maiúscula, minúscula, número e símbolo.
            </p>
            <div>
              <label htmlFor="account-new-password" className="block pb-1 text-sm">Nova senha</label>
              <input id="account-new-password" className="input w-full" type="password" autoComplete="new-password"
                aria-describedby="new-password-hint" minLength={8} maxLength={128} required
                value={password} onChange={event => setPassword(event.target.value)} />
            </div>
            <div>
              <label htmlFor="account-confirm-password" className="block pb-1 text-sm">Confirmar nova senha</label>
              <input id="account-confirm-password" className="input w-full" type="password" autoComplete="new-password"
                required value={confirmation} onChange={event => setConfirmation(event.target.value)} />
            </div>
            {error && <p role="alert" className="text-sm text-[var(--color-danger)]">{error}</p>}
            <button type="submit" disabled={status === 'saving'} className="btn btn-primary min-h-11 w-full">
              {status === 'saving' ? 'Salvando…' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
