'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../components/auth/AuthProvider';

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useParams();
  const { nexusAuthUrl } = useAuth();
  const token = params?.token as string;

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Token de verificação em falta.');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${nexusAuthUrl}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || `HTTP ${res.status}`);
        }

        setStatus('success');
        // Redireciona após 3 segundos
        setTimeout(() => router.push('/login'), 3000);
      } catch (err) {
        setStatus('error');
        setError((err as Error).message);
      }
    })();
  }, [token, nexusAuthUrl, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="text-6xl mb-4">✦</div>
          <h1 className="font-orbitron text-3xl font-bold tracking-wide">
            <span className="text-primary">Z</span>
            <span className="text-[var(--color-text)]">ENITH</span>
          </h1>
        </div>

        <div className="card p-8 hud-border text-center">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[var(--color-surface-2)] border-t-[var(--color-primary)] animate-spin" />
              <h2 className="font-orbitron text-xl font-bold text-[var(--color-text)] mb-2">
                A verificar email...
              </h2>
              <p className="text-[var(--color-text-dim)] text-sm">
                Estamos a confirmar o teu email, aguarda um momento.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-success-glow)] flex items-center justify-center text-3xl">
                ✓
              </div>
              <h2 className="font-orbitron text-xl font-bold text-[var(--color-text)] mb-2">
                Email verificado!
              </h2>
              <p className="text-[var(--color-text-dim)] text-sm mb-6">
                A tua conta está ativa. A redirecionar para o login...
              </p>
              <Link href="/login" className="btn btn-primary w-full">
                Ir para o login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-danger-glow)] flex items-center justify-center text-3xl">
                ✕
              </div>
              <h2 className="font-orbitron text-xl font-bold text-[var(--color-text)] mb-2">
                Erro na verificação
              </h2>
              <p className="text-[var(--color-danger)] text-sm mb-6">
                {error || 'Token inválido ou expirado.'}
              </p>
              <Link href="/login" className="btn btn-primary w-full">
                Voltar ao login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
