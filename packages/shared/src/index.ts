/**
 * Barrel export do pacote @zenith/shared.
 *
 * IMPORTANTE: NÃO exportar `./components/Logo` daqui — o Logo.tsx
 * requer JSX que o backend NestJS não tem configurado. Consumers
 * devem importar diretamente:
 *   import { Logo } from '@zenith/shared/components/Logo';
 *
 * Também não exportar `./ai` (MockAIProvider) aqui se o backend
 * importar este barrel, porque o ai/index.ts pode ter dependências
 * que conflitam com o backend. Consumers devem importar diretamente:
 *   import { aiProvider } from '@zenith/shared/ai';
 */

export * from './types';
export * from './auth';
