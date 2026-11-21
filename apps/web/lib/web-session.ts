import type { NexusUser } from '@zenith/shared';

export type WebSession = { user: NexusUser; accessToken: string };
type SessionAction = { action: 'restore' | 'logout' } | { action: 'login'; email: string; password: string };

export async function requestWebSession(input: SessionAction): Promise<WebSession | null> {
  const send = async () => {
    const response = await fetch('/api/session/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      cache: 'no-store',
    });
    if (response.status === 401 && input.action === 'restore') return null;
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.message ?? 'Não foi possível confirmar a sessão.');
    return payload;
  };

  // A rotação de refresh precisa ser serializada entre abas da mesma origem.
  return navigator.locks ? navigator.locks.request('zenith-web-session', send) : send();
}
