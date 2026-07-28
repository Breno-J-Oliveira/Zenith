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

  // Validações em tempo real (espelha password.schema.ts do NexusAuth)
  const COMMON_PASSWORDS = ['password','123456','12345678','qwerty','abc123','senha','senha123','admin','letmein','welcome','monkey','master','dragon','login','princess','football','shadow','sunshine','trustno1','batman','access','hello','charlie','donald','michael','qwerty123','1q2w3e4r','password1','password123'];
  const checks = {
    length: password.length >= 8 && password.length <= 128,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
    noCommon: !COMMON_PASSWORDS.includes(password.toLowerCase()),
    noSequential: !/(.)\1{3,}/.test(password),
    noKeyboard: !/qwerty|asdf|zxcv|1234|abcd/i.test(password),
  };
  const allValid = Object.values(checks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!name || !email || !password) {
      setLocalError('Preenche todos os campos.');
      return;
    }
    if (!allValid) {
      setLocalError('A password não cumpre todos os requisitos.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('As passwords não coincidem.');
      return;
    }
    setSubmitting(true);
    try {
      await register(email, password, name);
      // Se o registro retornar sem erro, redireciona para login
      router.push('/login?registered=true');
    } catch (err) {
      const msg = (err as Error).message || 'Erro ao registar';
      // Traduzir erros comuns do NexusAuth
      if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
        setLocalError('Este email já está registado. Tenta fazer login.');
      } else if (msg.includes('password') || msg.includes('Password')) {
        setLocalError('Password não cumpre os requisitos de segurança.');
      } else {
        setLocalError(msg);
      }
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
                  placeholder="Cria uma password forte"
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
              {/* Requisitos de senha em tempo real */}
              <div className="mt-2 space-y-1">
                <p className={`text-[10px] font-mono ${checks.length ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'}`}>
                  {checks.length ? '✓' : '○'} 8-128 caracteres
                </p>
                <p className={`text-[10px] font-mono ${checks.upper && checks.lower ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'}`}>
                  {checks.upper && checks.lower ? '✓' : '○'} Maiúsculas e minúsculas (Aa)
                </p>
                <p className={`text-[10px] font-mono ${checks.number ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'}`}>
                  {checks.number ? '✓' : '○'} Um número (0-9)
                </p>
                <p className={`text-[10px] font-mono ${checks.special ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'}`}>
                  {checks.special ? '✓' : '○'} Um símbolo (!@#$%...)
                </p>
                <p className={`text-[10px] font-mono ${checks.noKeyboard ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                  {checks.noKeyboard ? '✓' : '✕'} Sem padrões de teclado (1234, qwerty, abcd)
                </p>
                <p className={`text-[10px] font-mono ${checks.noCommon ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                  {checks.noCommon ? '✓' : '✕'} Não ser senha comum
                </p>
              </div>
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
              disabled={submitting || loading || !allValid}
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
      </div>
    </div>
  );
}