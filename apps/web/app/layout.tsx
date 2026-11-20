import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { AuthProvider } from '../components/auth/AuthProvider'
import { AuthEventsListener } from '../components/auth/AuthEventsListener'

const orbitron = localFont({
  src: [{ path: './fonts/orbitron-400-900.woff2', weight: '400 900' }],
  variable: '--font-orbitron',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})

const spaceMono = localFont({
  src: [
    { path: './fonts/spacemono-400.woff2', weight: '400' },
    { path: './fonts/spacemono-700.woff2', weight: '700' },
  ],
  variable: '--font-space-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'monospace'],
})

const rajdhani = localFont({
  src: [
    { path: './fonts/rajdhani-300.woff2', weight: '300' },
    { path: './fonts/rajdhani-400.woff2', weight: '400' },
    { path: './fonts/rajdhani-500.woff2', weight: '500' },
    { path: './fonts/rajdhani-600.woff2', weight: '600' },
    { path: './fonts/rajdhani-700.woff2', weight: '700' },
  ],
  variable: '--font-rajdhani',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})

export const metadata: Metadata = {
  title: 'Zenith — Organização Pessoal com IA',
  description: 'Plataforma fullstack de produtividade pessoal: metas, rotinas, páginas, databases, calendário e chat com IA — em web, desktop e mobile.',
  keywords: ['zenith', 'produtividade', 'ia', 'metas', 'rotinas', 'notion', 'gemini', 'nestjs', 'nextjs', 'prisma'],
  authors: [{ name: 'Breno J. Oliveira' }],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Zenith — Organização Pessoal com IA',
    description: 'Plataforma fullstack de produtividade com IA.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" data-theme="red">
      <body className={`${orbitron.variable} ${spaceMono.variable} ${rajdhani.variable}`}>
        <AuthProvider>
          <AuthEventsListener />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
