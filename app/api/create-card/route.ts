import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { username, lotteryNumber, password, force, gameId } = body

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!username?.trim() || !lotteryNumber?.trim()) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const supabase = getSupabase()

  // Duplicate username check (skipped when admin explicitly forces)
  if (!force) {
    const { data: existing } = await supabase
      .from('lottery_cards')
      .select('created_at')
      .eq('username', username.trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'username_taken', existingDate: existing.created_at },
        { status: 409 }
      )
    }
  }

  const token = uuidv4()

  const { error } = await supabase
    .from('lottery_cards')
    .insert({
      token,
      username: username.trim(),
      lottery_number: lotteryNumber.trim(),
      game_id: gameId ?? null,
    })

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 })
  }

  return NextResponse.json({ token })
}
