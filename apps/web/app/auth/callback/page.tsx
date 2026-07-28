'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveTokens } from '@zenith/shared';

/**
 * /auth/callback — Recebe tokens do OAuth (Google/GitHub) via query params
 * após o redirecionamento do NexusAuth. Salva os tokens e redireciona para /dashboard.
 */
export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      // Save tokens to in-memory store
      saveTokens(JSON.stringify({ accessToken, refreshToken }));

      // Set auth cookie for middleware protection
      document.cookie = `zenith_auth=authenticated; path=/; max-age=${15 * 60}; samesite=lax`;

      // Redirect to dashboard
      router.push('/dashboard');
    } else {
      // No tokens — redirect to login with error
      router.push('/login?error=oauth_failed');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="text-center">
        <div className="text-4xl mb-4">✦</div>
        <p className="text-[var(--color-text-dim)] text-sm">Processando login...</p>
      </div>
    </div>
  );
}