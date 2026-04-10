import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const item = req.nextUrl.searchParams.get('i') || ''

    if (!item.trim()) {
      return NextResponse.json({ error: 'No item. Use ?i=milk' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const homeId = process.env.IFTTT_HOME_ID
    if (!homeId) return NextResponse.json({ error: 'Home not configured' }, { status: 500 })

    const { data: member } = await supabase
      .from('home_members')
      .select('user_id')
      .eq('home_id', homeId)
      .limit(1)
      .single()

    if (!member) return NextResponse.json({ error: 'Home not found' }, { status: 404 })

    const { error } = await supabase.from('shopping_items').insert({
      home_id: homeId,
      name: item.trim(),
      quantity: null,
      added_by: member.user_id,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, item: item.trim() })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
