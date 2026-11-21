'use client';

/** Reconcilia a sessão quando a API recusa o access token atual. */
import { useEffect } from 'react';
import { useAuth } from './AuthProvider';

/**
 * Componente invisível que regista handlers para os custom events.
 * Deve ser renderizado uma vez dentro do AuthProvider.
 */
export function AuthEventsListener() {
  const { refreshUser } = useAuth();

  useEffect(() => {
    const restoreSession = () => {
      void refreshUser();
    };

    window.addEventListener('zenith:auth:logout', restoreSession);

    return () => {
      window.removeEventListener('zenith:auth:logout', restoreSession);
    };
  }, [refreshUser]);

  return null;
}
