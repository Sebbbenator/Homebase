import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { insertShoppingItem } from '@/lib/shopping-server'

// Kort URL til Siri-genveje: /api/ext/hb26/shop?i=mælk
export async function GET(req: NextRequest) {
  try {
    const item = req.nextUrl.searchParams.get('i') || ''
    if (!item.trim()) return NextResponse.json({ error: 'No item. Use ?i=mælk' }, { status: 400 })

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
