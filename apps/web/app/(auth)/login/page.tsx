'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../components/auth/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, loading, error, nexusHealthy, nexusAuthUrl } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Se já está autenticado, redireciona para o destino
  useEffect(() => {
    if (!loading && isAuthenticated) {
      const next = searchParams.get('next') || '/dashboard';
      router.push(next);
    }
  }, [loading, isAuthenticated, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email || !password) {
      setLocalError('Preenche o email e a password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setLocalError((err as Error).message || 'Erro ao entrar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4 py-12 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="text-6xl mb-4">✦</div>
          <h1 className="font-orbitron text-3xl font-bold tracking-wide">
            <span className="text-primary">Z</span>
            <span className="text-[var(--color-text)]">ENITH</span>
          </h1>
          <p className="text-[var(--color-text-dim)] text-sm mt-1">
            Organização Pessoal com IA
          </p>
        </div>

        {/* Card de login */}
        <div className="card p-8 hud-border">
          <h2 className="font-orbitron text-xl font-bold text-[var(--color-text)] mb-2">
            Bem-vindo de volta
          </h2>
          <p className="text-[var(--color-text-dim)] text-sm mb-6">
            Entra com a tua conta para continuar
          </p>

          {/* Aviso: NexusAuth indisponível */}
          {nexusHealthy === false && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--color-warning-glow)] border border-[var(--color-warning)]/40 text-xs text-[var(--color-warning)]">
              <strong>Serviço de auth indisponível.</strong>
              <br />
              Verifica se o NexusAuth está a correr em{' '}
              <code className="font-mono">{nexusAuthUrl}</code>.
              <br />
              Em dev, define <code className="font-mono">NEXUS_AUTH_SKIP_VALIDATION=true</code> no backend.
            </div>
          )}

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

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider">
                  PASSWORD
                </label>
                <a
                  href={`${nexusAuthUrl}/auth/forgot-password`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-[var(--color-text-dim)] hover:text-[var(--color-primary)] transition-colors"
                >
                  Esqueceste-te?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
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
            </div>

            {(localError || error) && (
              <div className="p-3 rounded-lg bg-[var(--color-danger-glow)] border border-[var(--color-danger)]/40 text-sm text-[var(--color-danger)]">
                {localError || error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || loading}
              className="btn btn-primary w-full"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  A entrar...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--color-text-dim)]">
            Não tens conta?{' '}
            <Link
              href="/register"
              className="text-[var(--color-primary)] hover:underline font-medium"
            >
              Criar conta
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-[var(--color-text-muted)] mb-3">ou continua com</p>
          <div className="flex gap-3 justify-center">
            <a
              href={`${nexusAuthUrl}/auth/google`}
              className="btn btn-secondary text-sm flex items-center gap-2"
              title="Login com Google"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              </svg>
              Google
            </a>
            <a
              href={`${nexusAuthUrl}/auth/github`}
              className="btn btn-secondary text-sm flex items-center gap-2"
              title="Login com GitHub"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
