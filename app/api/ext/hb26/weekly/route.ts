import { NextResponse } from 'next/server'
import { buildWeeklyText } from '@/lib/scoreboard'
import { pushToHome } from '@/lib/push-server'

// Ugens opsummering – fuldførelser og point pr. person de sidste 7 dage
export async function GET() {
  try {
    const homeId = process.env.IFTTT_HOME_ID
    if (!homeId) return NextResponse.json({ error: 'Home not configured' }, { status: 500 })

    const body = await buildWeeklyText(homeId)
    const sent = await pushToHome(homeId, { title: '📊 Ugens opsummering', body, url: '/hjem', tag: 'weekly-' + Date.now() })

    return NextResponse.json({ success: true, sent, summary: body })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
