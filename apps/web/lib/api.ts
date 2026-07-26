/**
 * Cliente HTTP centralizado para o backend Zenith.
 *
 * Esta é a única fonte de verdade para a URL do backend. Todos os
 * componentes devem importar `API` e `apiFetch` daqui em vez de
 * hardcodar `http://localhost:3002`.
 *
 * Configurável por variável de ambiente:
 *   NEXT_PUBLIC_API_URL — opcional. Default: http://localhost:3002
 *
 * Autenticação:
 *   Lê o access token do NexusAuth a partir do token store (in-memory
 *   por defeito) e adiciona automaticamente em `Authorization: Bearer`.
 *   Se o token expirar e o backend retornar 401, dispara logout via
 *   custom event "zenith:auth:logout" para o AuthProvider reagir.
 */

export const API =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export interface ApiError {
  status: number;
  message: string;
  body?: any;
}

export class ApiRequestError extends Error {
  status: number;
  body?: any;
  constructor(message: string, status: number, body?: any) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  /** Quando true, envia `body` como JSON. Default: true. */
  json?: boolean;
  /** Quando true, NÃO envia o Bearer token (útil para endpoints públicos) */
  skipAuth?: boolean;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
  let url = path.startsWith('http') ? path : `${API}${path.startsWith('/') ? '' : '/'}${path}`;
  if (params) {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      search.set(k, String(v));
    }
    const qs = search.toString();
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  }
  return url;
}

/** Lê os tokens do token store de forma lazy */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const { loadTokens } = require('@zenith/shared');
    const raw = loadTokens();
    if (!raw) return null;
    const tokens = JSON.parse(raw);
    return tokens?.accessToken ?? null;
  } catch {
    return null;
  }
}

/**
 * Wrapper de `fetch` com JSON automático, tratamento de erro e auth.
 */
export async function apiFetch<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, json = true, headers, skipAuth = false, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  let finalBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (json) {
      finalHeaders['Content-Type'] = 'application/json';
      finalBody = JSON.stringify(body);
    } else {
      finalBody = body as BodyInit;
    }
  }

  const url = buildUrl(path, (rest as any).params);
  const { params: _ignore, ...fetchInit } = rest as any;

  const res = await fetch(url, { ...fetchInit, headers: finalHeaders, body: finalBody });

  const text = await res.text();
  const data = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) ||
      res.statusText ||
      `HTTP ${res.status}`;

    // 401 = token inválido/expirado. Disparar logout no AuthProvider.
    if (res.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('zenith:auth:logout'));
    }

    throw new ApiRequestError(
      typeof message === 'string' ? message : JSON.stringify(message),
      res.status,
      data,
    );
  }

  return data as T;
}

function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Atalho: GET */
export const apiGet = <T = any>(path: string, options?: FetchOptions) =>
  apiFetch<T>(path, { ...options, method: 'GET' });

/** Atalho: POST com JSON */
export const apiPost = <T = any>(path: string, body?: any, options?: FetchOptions) =>
  apiFetch<T>(path, { ...options, method: 'POST', body });

/** Atalho: PATCH com JSON */
export const apiPatch = <T = any>(path: string, body?: any, options?: FetchOptions) =>
  apiFetch<T>(path, { ...options, method: 'PATCH', body });

/** Atalho: PUT com JSON */
export const apiPut = <T = any>(path: string, body?: any, options?: FetchOptions) =>
  apiFetch<T>(path, { ...options, method: 'PUT', body });

/** Atalho: DELETE */
export const apiDelete = <T = any>(path: string, options?: FetchOptions) =>
  apiFetch<T>(path, { ...options, method: 'DELETE' });
