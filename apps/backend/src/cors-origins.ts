export function webCorsOrigins(value: string | undefined, production: boolean): string[] | '*' | false {
  const entries = value?.split(',').map(entry => entry.trim()).filter(Boolean) ?? [];
  if (!entries.length) return production ? false : '*';

  const origins = entries.map(entry => {
    try {
      const url = new URL(entry);
      if (
        (url.protocol === 'http:' || url.protocol === 'https:') &&
        !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash
      ) {
        return url.origin;
      }
    } catch {
      // A mensagem abaixo também cobre URLs que não puderam ser interpretadas.
    }
    throw new Error('CORS_ORIGINS deve conter somente origens HTTP ou HTTPS, separadas por vírgulas.');
  });

  return [...new Set(origins)];
}
