import type { Metadata, Viewport } from 'next'
import { Fredoka, Nunito } from 'next/font/google'
import { ServiceWorkerRegistrar } from '@/components/push/ServiceWorkerRegistrar'
import { ToastProvider } from '@/components/ui/Toast'
import './globals.css'

const display = Fredoka({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' })
const body = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'HomeBase',
  description: 'Opgaver, indkøb og point – for hele husstanden.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HomeBase',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F9F4EC' },
    { media: '(prefers-color-scheme: dark)', color: '#1A1512' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className={`${display.variable} ${body.variable} h-full`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full font-sans">
        <ServiceWorkerRegistrar />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
