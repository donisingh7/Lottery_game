import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password')

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('lottery_cards')
    .select(`
      username,
      lottery_number,
      token,
      is_scratched,
      created_at,
      lottery_games (
        id,
        name,
        entry_fee,
        prize_title,
        prize_amount
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ cards: data })
}
