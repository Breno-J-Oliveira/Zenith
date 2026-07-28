'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/auth/AuthProvider';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, loading, error, nexusHealthy, nexusAuthUrl } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!name || !email || !password) {
      setLocalError('Preenche todos os campos.');
      return;
    }
    if (password.length < 8) {
      setLocalError('A password deve ter no mínimo 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('As passwords não coincidem.');
      return;
    }
    setSubmitting(true);
    try {
      await register(email, password, name);
    } catch (err) {
      setLocalError((err as Error).message || 'Erro ao registar');
    } finally {
      setSubmitting(false);
    }
  };

  // Força da password (visual)
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
          <p className="text-[var(--color-text-dim)] text-sm mt-1">
            Cria a tua conta
          </p>
        </div>

        <div className="card p-8 hud-border">
          <h2 className="font-orbitron text-xl font-bold text-[var(--color-text)] mb-2">
            Bem-vindo
          </h2>
          <p className="text-[var(--color-text-dim)] text-sm mb-6">
            Preenche os teus dados para começar
          </p>

          {nexusHealthy === false && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--color-warning-glow)] border border-[var(--color-warning)]/40 text-xs text-[var(--color-warning)]">
              <strong>Serviço de auth indisponível.</strong>
              <br />
              Verifica se o NexusAuth está a correr em{' '}
              <code className="font-mono">{nexusAuthUrl}</code>.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider block mb-2">
                NOME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="O teu nome"
                required
                autoFocus
                autoComplete="name"
                className="input w-full"
                disabled={submitting}
              />
            </div>

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
                autoComplete="email"
                className="input w-full"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="font-mono text-[10px] text-[var(--color-text-dim)] tracking-wider block mb-2">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
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
                  A criar conta...
                </>
              ) : (
                'Criar conta'
              )}
            </button>
          </form>

          <p className="text-[10px] text-[var(--color-text-muted)] text-center mt-4">
            Ao criar conta, aceitas os termos de uso e política de privacidade.
          </p>
        </div>

        <p className="text-center text-sm text-[var(--color-text-dim)] mt-6">
          Já tens conta?{' '}
          <Link
            href="/login"
            className="text-[var(--color-primary)] hover:underline font-medium"
          >
            Entrar
          </Link>
        </p>

        <p className="text-center text-[10px] text-[var(--color-text-muted)] mt-6 font-mono">
          Powered by <span className="text-[var(--color-primary)]">NexusAuth</span>
        </p>
      </div>
    </div>
  );
}
