import { createClient } from '@supabase/supabase-js'
import ScratchCardView from '@/components/ScratchCardView'

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <p className="text-6xl">🎫</p>
        <h1 className="text-2xl font-bold text-white">Card Not Found</h1>
        <p className="text-gray-500 text-sm">This scratch card link is invalid or does not exist.</p>
      </div>
    </div>
  )
}

function AlreadyScratched({
  username,
  lotteryNumber,
}: {
  username: string
  lotteryNumber: string
}) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-sm w-full">
        <div className="space-y-2">
          <p className="text-5xl">🔒</p>
          <h1 className="text-2xl font-bold text-white">Already Scratched</h1>
          <p className="text-gray-400 text-sm">
            Hey <span className="text-yellow-400 font-semibold">{username}</span>, this card has
            already been used.
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-2">
          <p className="text-gray-500 text-xs uppercase tracking-widest">Your Number Was</p>
          <p className="text-yellow-400 font-black text-6xl">{lotteryNumber}</p>
        </div>
        <p className="text-gray-600 text-xs">Each card can only be scratched once.</p>
      </div>
    </div>
  )
}

export default async function ScratchPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('lottery_cards')
    .select('username, lottery_number, is_scratched')
    .eq('token', token)
    .single()

  if (error || !data) return <NotFound />

  if (data.is_scratched) {
    return <AlreadyScratched username={data.username} lotteryNumber={data.lottery_number} />
  }

  return (
    <ScratchCardView
      username={data.username}
      lotteryNumber={data.lottery_number}
      token={token}
    />
  )
}
