'use client';

/**
 * AuthEventsListener — Listener global para eventos de auth.
 *
 * Ouve o evento `zenith:auth:logout` (disparado pelo `lib/api.ts`
 * quando recebe 401) e o evento `zenith:auth:refresh` (futuro).
 *
 * O logout é centralizado aqui para que qualquer ponto da app
 * (api, componentes, etc.) possa disparar sem ter de importar
 * o `AuthProvider` (que é um hook).
 */

import { useEffect } from 'react';
import { useAuth } from './AuthProvider';

/**
 * Componente invisível que regista handlers para os custom events.
 * Deve ser renderizado uma vez dentro do AuthProvider.
 */
export function AuthEventsListener() {
  const { logout } = useAuth();

  useEffect(() => {
    const handleLogout = () => {
      // Limpa o estado e redireciona para /login
      logout();
    };

    window.addEventListener('zenith:auth:logout', handleLogout);

    return () => {
      window.removeEventListener('zenith:auth:logout', handleLogout);
    };
  }, [logout]);

  return null;
}
