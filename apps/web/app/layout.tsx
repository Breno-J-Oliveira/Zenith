import type { Metadata } from 'next'
import { Orbitron, Space_Mono, Rajdhani } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../components/auth/AuthProvider'
import { AuthEventsListener } from '../components/auth/AuthEventsListener'

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'monospace'],
})

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
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
