'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Logo } from '@zenith/shared';
import { useAuth } from '../../../../components/auth/AuthProvider';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const { nexusAuthUrl } = useAuth();
  const token = params?.token as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Token de reset em falta.');
      setTokenValid(false);
    }
  }, [token]);

  const passwordStrength = (() => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const map = [
      { label: 'Muito fraca', color: 'bg-[var(--color-danger)]' },
      { label: 'Fraca', color: 'bg-[var(--color-warning)]' },
      { label: 'Razoável', color: 'bg-[var(--color-warning)]' },
      { label: 'Boa', color: 'bg-[var(--color-success)]' },
      { label: 'Forte', color: 'bg-[var(--color-success)]' },
    ];
    return { score, ...map[score] };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) return;
    if (!password) {
      setError('Insere a nova password.');
      return;
    }
    if (password.length < 8) {
      setError('A password deve ter no mínimo 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As passwords não coincidem.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${nexusAuthUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}`);
      }

      // Sucesso — redireciona para o login
      router.push('/login?reset=success');
    } catch (err) {
      setError((err as Error).message || 'Erro ao redefinir password');
    } finally {
      setSubmitting(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="card p-8 hud-border max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-danger-glow)] flex items-center justify-center text-3xl">
            ✕
          </div>
          <h2 className="font-orbitron text-xl font-bold text-[var(--color-text)] mb-2">
            Token inválido
          </h2>
          <p className="text-[var(--color-danger)] text-sm mb-6">
            O link de reset é inválido ou expirou.
          </p>
          <Link href="/forgot-password" className="btn btn-primary w-full">
            Pedir novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo size={64} className="text-primary mb-4" />
          <h1 className="font-orbitron text-3xl font-bold tracking-wide">
            <span className="text-primary">Z</span>
            <span className="text-[var(--color-text)]">ENITH</span>
          </h1>
        </div>

        <div className="card p-8 hud-border">
          <h2 className="font-orbitron text-xl font-bold text-[var(--color-text)] mb-2">
            Redefinir password
          </h2>
          <p className="text-[var(--color-text-dim)] text-sm mb-6">
            Escolhe uma password forte para a tua conta.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider block mb-2">
                NOVA PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  autoFocus
                  autoComplete="new-password"
                  className="input w-full pr-12"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--color-text-dim)] font-mono w-20 text-right">
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider block mb-2">
                CONFIRMAR PASSWORD
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repete a password"
                required
                autoComplete="new-password"
                className={`input w-full ${
                  confirmPassword && confirmPassword !== password
                    ? 'border-[var(--color-danger)]'
                    : ''
                }`}
                disabled={submitting}
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="mt-1 text-[10px] text-[var(--color-danger)] font-mono">
                  As passwords não coincidem
                </p>
              )}
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
                  A redefinir...
                </>
              ) : (
                'Redefinir password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
