'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

type Widget = {
  render: (container: HTMLElement, options: {
    sitekey: string;
    action: string;
    size: 'compact';
    callback: (token: string) => void;
    'expired-callback': () => void;
    'error-callback': () => void;
  }) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

function turnstile() {
  return (window as Window & { turnstile?: Widget }).turnstile;
}

export function RegistrationChallenge({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [canRetry, setCanRetry] = useState(false);
  const [state, setState] = useState<'loading' | 'pending' | 'confirmed' | 'expired' | 'failed'>('loading');

  useEffect(() => {
    if (!ready || !container.current) return;
    const widget = turnstile();
    if (!widget) {
      setState('failed');
      return;
    }
    const invalidate = (next: 'expired' | 'failed') => {
      onToken('');
      setState(next);
    };
    setState('pending');
    try {
      widgetId.current = widget.render(container.current, {
        sitekey: siteKey,
        action: 'zenith_register',
        size: 'compact',
        callback: token => {
          onToken(token);
          setState('confirmed');
        },
        'expired-callback': () => invalidate('expired'),
        'error-callback': () => invalidate('failed'),
      });
      setCanRetry(true);
    } catch {
      invalidate('failed');
    }
    return () => {
      if (widgetId.current !== null) widget.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [ready, siteKey, onToken]);

  function retry() {
    if (widgetId.current === null) return;
    onToken('');
    setState('pending');
    turnstile()?.reset(widgetId.current);
  }

  return (
    <fieldset className="space-y-2">
      <legend className="pb-1 text-sm font-medium">Verificação de segurança</legend>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
        onError={() => {
          onToken('');
          setState('failed');
        }}
      />
      <div ref={container} />
      {state === 'loading' && <p role="status" className="text-sm">Carregando a verificação…</p>}
      {state === 'expired' && <p role="alert" className="text-sm">A verificação expirou. Tente novamente.</p>}
      {state === 'failed' && <p role="alert" className="text-sm">A verificação está indisponível. Confira sua conexão ou recarregue a página.</p>}
      {(state === 'expired' || state === 'failed') && (
        <button type="button" className="btn btn-secondary min-h-11" onClick={retry} disabled={!canRetry}>
          Refazer verificação
        </button>
      )}
    </fieldset>
  );
}
