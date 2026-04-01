import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { ServiceWorkerRegistrar } from '@/components/push/ServiceWorkerRegistrar'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'HomeBase — Household Manager',
  description: 'Manage tasks, shopping, and activities with your household.',
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
  themeColor: '#0f0f0f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} dark h-full`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full bg-neutral-950 text-neutral-50 antialiased font-sans">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  )
}
