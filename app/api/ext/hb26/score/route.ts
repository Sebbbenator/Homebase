import { NextResponse } from 'next/server'
import { buildScoreboardText } from '@/lib/scoreboard'
import { pushToHome } from '@/lib/push-server'

// Kort URL til Siri-genveje: sender scoretavlen som push
export async function GET() {
  try {
    const homeId = process.env.IFTTT_HOME_ID
    if (!homeId) return NextResponse.json({ error: 'Home not configured' }, { status: 500 })

    const body = await buildScoreboardText(homeId)
    const sent = await pushToHome(homeId, { title: '🏆 Scoretavle', body, url: '/hjem', tag: 'score-' + Date.now() })

    return NextResponse.json({ success: true, sent })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
