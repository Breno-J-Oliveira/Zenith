import type { Metadata } from 'next'
import { Orbitron, Space_Mono, Rajdhani } from 'next/font/google'
import './globals.css'

const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
})

const spaceMono = Space_Mono({ 
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
})

const rajdhani = Rajdhani({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Zenith - Organização Pessoal com IA',
  description: 'Organize sua vida com o poder da IA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" data-theme="red">
      <body className={`${orbitron.variable} ${spaceMono.variable} ${rajdhani.variable}`}>
        {children}
      </body>
    </html>
  )
}
