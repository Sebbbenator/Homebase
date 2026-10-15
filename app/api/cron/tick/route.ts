import { NextRequest, NextResponse } from 'next/server'
import { runTick } from '@/lib/cron/jobs'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Cron-tick: kør alle planlagte notifikationer. Idempotent – kan kaldes så ofte man vil.
 * Auth: Vercel Cron sender `Authorization: Bearer $CRON_SECRET`; eksterne schedulere kan bruge `?key=`.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  const key = req.nextUrl.searchParams.get('key')
  if (!secret || (auth !== `Bearer ${secret}` && key !== secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runTick()
    return NextResponse.json({ ok: true, at: new Date().toISOString(), result })
  } catch (err) {
    console.error('cron tick fejlede', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
