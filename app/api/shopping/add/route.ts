import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// This endpoint is for external integrations (IFTTT, Google Home, etc.)
// Auth is via IFTTT_API_KEY header or query param
export async function POST(req: NextRequest) {
  try {
    // Check API key
    const apiKey =
      req.headers.get('x-api-key') ||
      req.nextUrl.searchParams.get('key')

    if (!apiKey || apiKey !== process.env.IFTTT_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse body — IFTTT sends JSON or form data
    let item = ''
    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const body = await req.json()
      item = body.item || body.value1 || ''
    } else {
      // Fallback: check query params (useful for simple GET-style testing)
      item = req.nextUrl.searchParams.get('item') || ''
    }

    if (!item.trim()) {
      return NextResponse.json({ error: 'No item provided' }, { status: 400 })
    }

    // Use Supabase with service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the home ID from env
    const homeId = process.env.IFTTT_HOME_ID
    if (!homeId) {
      return NextResponse.json({ error: 'Home not configured' }, { status: 500 })
    }

    // Get a member of this home to use as added_by
    const { data: member } = await supabase
      .from('home_members')
      .select('user_id')
      .eq('home_id', homeId)
      .limit(1)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'Home not found' }, { status: 404 })
    }

    // Add the item
    const { error } = await supabase.from('shopping_items').insert({
      home_id: homeId,
      name: item.trim(),
      quantity: null,
      added_by: member.user_id,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: item.trim() })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Also support GET for easy testing
export async function GET(req: NextRequest) {
  return POST(req)
}
