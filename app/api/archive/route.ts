import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password')

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  const [gamesResult, cardsResult] = await Promise.all([
    supabase
      .from('lottery_games')
      .select('id, name, entry_fee, prize_title, prize_amount, reveal_date, created_at')
      .eq('is_archived', true)
      .order('created_at', { ascending: false }),

    supabase
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
          prize_amount,
          reveal_date
        )
      `)
      .eq('is_archived', true)
      .order('created_at', { ascending: false }),
  ])

  return NextResponse.json({
    games: gamesResult.data ?? [],
    cards: cardsResult.data ?? [],
  })
}
