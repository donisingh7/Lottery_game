import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password')
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('lottery_games')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ games: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { password, name, entryFee, prizeTitle, prizeAmount, revealDate } = body

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!name?.trim() || !entryFee || !prizeTitle?.trim() || !prizeAmount?.trim()) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const fee = parseFloat(entryFee)
  if (isNaN(fee) || fee < 0) {
    return NextResponse.json({ error: 'Entry fee must be a valid number' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('lottery_games')
    .insert({
      name: name.trim(),
      entry_fee: fee,
      prize_title: prizeTitle.trim(),
      prize_amount: prizeAmount.trim(),
      reveal_date: revealDate || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ game: data })
}
