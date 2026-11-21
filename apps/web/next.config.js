/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.ZENITH_TEST_WEB === 'true' ? '.next-zenith-test' : '.next',
  // ─── Exportação Estática (necessário para Tauri Desktop) ──────────────
  // Gera HTML/CSS/JS estáticos em /out que o Tauri carrega via file://
  // Usamos `next build && next export` (scripts separados) em vez de
  // `output: 'export'` para evitar problemas com rotas dinâmicas.
  trailingSlash: true,

  // Desativa otimização de imagens (não disponível em export estático)
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // ─── Nota sobre Middleware ────────────────────────────────────────────
  // Com output: 'export', o proxy.ts NÃO é executado.
  // A proteção de rotas passa a ser 100% client-side via AuthProvider.
  // Isso é aceitável: o AuthProvider já faz a validação real do token.

}

module.exports = nextConfig
