import { NextRequest, NextResponse } from 'next/server'
import { buildScoreboardText } from '@/lib/scoreboard'
import { pushToHome } from '@/lib/push-server'

// "Hey Google, aktiver score" → sender scoretavlen som push til alle i huset
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('key')
    if (!apiKey || apiKey !== process.env.IFTTT_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const homeId = process.env.IFTTT_HOME_ID
    if (!homeId) return NextResponse.json({ error: 'Home not configured' }, { status: 500 })

    const body = await buildScoreboardText(homeId)
    const sent = await pushToHome(homeId, { title: '🏆 Scoretavle', body, url: '/hjem', tag: 'score-' + Date.now() })

    return NextResponse.json({ success: true, sent, leaderboard: body })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
