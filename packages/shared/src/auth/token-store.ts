/**
 * Token store IN-MEMORY para tokens do NexusAuth.
 *
 * Tokens NUNCA são guardados em localStorage por defeito — protege contra
 * XSS attacks. Trade-off: tokens são perdidos em refresh de página.
 *
 * Para sessões persistentes, configurar um endpoint BFF (Backend-For-Frontend)
 * que troca um httpOnly refresh token cookie por um access token.
 *
 * Para usar localStorage (apenas DEV, inseguro):
 *   import { setTokenStoreMode } from '@zenith/shared';
 *   setTokenStoreMode('localStorage');
 */

type StoreMode = 'memory' | 'localStorage';
const STORAGE_KEY = 'zenith_nexus_tokens';

let currentMode: StoreMode = 'memory';
let memoryTokens: string | null = null;

export function setTokenStoreMode(mode: StoreMode): void {
  if (mode === 'localStorage' && typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.warn(
      '[NexusAuth] ⚠️  localStorage mode is INSECURE — tokens are readable by any JS. ' +
      'Use memory mode in production.',
    );
  }
  currentMode = mode;
}

export function getTokenStoreMode(): StoreMode {
  return currentMode;
}

export function loadTokens(): string | null {
  if (currentMode === 'localStorage') {
    try {
      return typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    } catch {
      return null;
    }
  }
  return memoryTokens;
}

export function saveTokens(raw: string | null): void {
  if (currentMode === 'localStorage') {
    try {
      if (typeof window === 'undefined') return;
      if (raw) {
        window.localStorage.setItem(STORAGE_KEY, raw);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* localStorage indisponível */
    }
    return;
  }
  memoryTokens = raw;
}
