import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { insertShoppingItem } from '@/lib/shopping-server'

// Ekstern tilføjelse (IFTTT, Google Home m.m.). Auth via x-api-key-header eller ?key=
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('key')
    if (!apiKey || apiKey !== process.env.IFTTT_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let item = ''
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await req.json()
      item = body.item || body.value1 || ''
    } else {
      item = req.nextUrl.searchParams.get('item') || ''
    }
    if (!item.trim()) return NextResponse.json({ error: 'No item provided' }, { status: 400 })

    const homeId = process.env.IFTTT_HOME_ID
    if (!homeId) return NextResponse.json({ error: 'Home not configured' }, { status: 500 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: member } = await supabase.from('home_members').select('user_id').eq('home_id', homeId).limit(1).single()
    if (!member) return NextResponse.json({ error: 'Home not found' }, { status: 404 })

    const inserted = await insertShoppingItem(supabase, homeId, member.user_id, item)
    return NextResponse.json({ success: true, item: inserted.name, section: inserted.section })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
