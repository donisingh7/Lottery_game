import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = getSupabase()

  const { data, error: fetchErr } = await supabase
    .from('lottery_cards')
    .select('is_scratched')
    .eq('token', token)
    .single()

  if (fetchErr || !data) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 })
  }

  if (data.is_scratched) {
    return NextResponse.json({ error: 'Already scratched' }, { status: 409 })
  }

  const { error } = await supabase
    .from('lottery_cards')
    .update({ is_scratched: true, scratched_at: new Date().toISOString() })
    .eq('token', token)

  if (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
