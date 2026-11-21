'use client';

import { useEffect, useState } from 'react';

export function useAccountLinkToken(previousLinkToken?: string) {
  const [token, setToken] = useState<string | null>(previousLinkToken ?? null);
  useEffect(() => {
    if (previousLinkToken) return;
    const fragment = window.location.hash.slice(1);
    if (fragment) {
      // Novos links usam fragmento. O token não aparece na requisição da página.
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    }
    setToken(current => current ?? fragment);
  }, [previousLinkToken]);
  return token;
}
