import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { username, lotteryNumber, password } = body

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!username?.trim() || !lotteryNumber?.trim()) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const supabase = getSupabase()
  const token = uuidv4()

  const { error } = await supabase
    .from('lottery_cards')
    .insert({ token, username: username.trim(), lottery_number: lotteryNumber.trim() })

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 })
  }

  return NextResponse.json({ token })
}
