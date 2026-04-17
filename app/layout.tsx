import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { ServiceWorkerRegistrar } from '@/components/push/ServiceWorkerRegistrar'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'HomeBase — Boligadministration',
  description: 'Administrer opgaver, indkøb og aktiviteter med din husstand.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HomeBase',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0c0c10',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} dark h-full`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full bg-[#0c0c10] text-neutral-50 antialiased font-sans">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  )
}
