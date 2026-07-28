'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../components/auth/AuthProvider';

export default function ForgotPasswordPage() {
  const { nexusAuthUrl } = useAuth();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Insere o teu email.');
      return;
    }

    setSubmitting(true);
    try {
      // Como o NexusAuth tem o seu próprio endpoint /auth/forgot-password,
      // redirecionamos o user para lá (ou usamos um proxy — futuro).
      // Por agora, enviamos o email direto via API pública do NexusAuth.
      const res = await fetch(`${nexusAuthUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Por segurança, a resposta do NexusAuth é sempre genérica
      // (não revela se o email existe). Consideramos sucesso sempre.
      setSubmitted(true);
    } catch (err) {
      setError((err as Error).message || 'Erro ao enviar email');
    } finally {
      setSubmitting(false);
    }
  };

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

        <div className="card p-8 hud-border">
          {submitted ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-success-glow)] flex items-center justify-center text-3xl">
                ✉️
              </div>
              <h2 className="font-orbitron text-xl font-bold text-[var(--color-text)] mb-2">
                Email enviado
              </h2>
              <p className="text-[var(--color-text-dim)] text-sm mb-6">
                Se o email <span className="text-[var(--color-text)] font-medium">{email}</span>{' '}
                estiver registado, vais receber um link para redefinir a tua password.
              </p>
              <Link href="/login" className="btn btn-primary w-full">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-orbitron text-xl font-bold text-[var(--color-text)] mb-2">
                Esqueci-me da password
              </h2>
              <p className="text-[var(--color-text-dim)] text-sm mb-6">
                Insere o teu email e vamos enviar-te um link para redefinir a password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider block mb-2">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    required
                    autoFocus
                    autoComplete="email"
                    className="input w-full"
                    disabled={submitting}
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-[var(--color-danger-glow)] border border-[var(--color-danger)]/40 text-sm text-[var(--color-danger)]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary w-full"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      A enviar...
                    </>
                  ) : (
                    'Enviar link de reset'
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-[var(--color-text-dim)] mt-6">
                Lembraste-te?{' '}
                <Link
                  href="/login"
                  className="text-[var(--color-primary)] hover:underline font-medium"
                >
                  Voltar ao login
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-[10px] text-[var(--color-text-muted)] mt-6 font-mono">
          Powered by <span className="text-[var(--color-primary)]">NexusAuth</span>
        </p>
      </div>
    </div>
  );
}
