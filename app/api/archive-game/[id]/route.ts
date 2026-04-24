import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { password } = await req.json()

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  // Archive the game
  const { error: gameErr } = await supabase
    .from('lottery_games')
    .update({ is_archived: true })
    .eq('id', id)

  if (gameErr) return NextResponse.json({ error: gameErr.message }, { status: 500 })

  // Archive all cards that belong to this game
  const { error: cardsErr } = await supabase
    .from('lottery_cards')
    .update({ is_archived: true })
    .eq('game_id', id)

  if (cardsErr) return NextResponse.json({ error: cardsErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
