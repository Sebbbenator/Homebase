'use client'

import { useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'

export function InviteCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch { /* ignoreres */ }
  }

  async function share() {
    const text = `Kom med i vores HomeBase-husstand. Invitationskode: ${code}`
    if (navigator.share) {
      try { await navigator.share({ text }) } catch { /* annulleret */ }
    } else {
      copy()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-extrabold text-muted">Invitationskode</span>
      <div className="flex items-center gap-2">
        <code className="flex-1 h-11 px-4 flex items-center bg-soft rounded-2xl text-[15px] font-mono font-bold text-accent-ink tracking-wider">{code}</code>
        <button type="button" onClick={copy} aria-label="Kopiér kode" className="w-11 h-11 rounded-2xl bg-soft flex items-center justify-center text-body">
          {copied ? <Check className="w-5 h-5 text-good-ink" /> : <Copy className="w-5 h-5" />}
        </button>
        <button type="button" onClick={share} aria-label="Del kode" className="w-11 h-11 rounded-2xl bg-accent text-ink flex items-center justify-center">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
      <p className="text-xs font-semibold text-faint">Del koden med dem du bor sammen med, så de kan komme med.</p>
    </div>
  )
}
