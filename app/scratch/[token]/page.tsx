import { createClient } from '@supabase/supabase-js'
import ScratchCardView from '@/components/ScratchCardView'

interface Game {
  name: string
  entryFee: number
  prizeTitle: string
  prizeAmount: string
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

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
  game,
}: {
  username: string
  lotteryNumber: string
  game: Game | null
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

        {game && (
          <div className="bg-purple-950/40 border border-purple-800 rounded-2xl p-4 space-y-2">
            <p className="text-purple-300 font-semibold text-sm">{game.name}</p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-gray-500 text-xs uppercase tracking-wider">Entry Fee</p>
                <p className="text-green-400 font-bold">{formatCurrency(game.entryFee)}</p>
              </div>
              <div className="w-px h-7 bg-gray-700" />
              <div className="text-center">
                <p className="text-gray-500 text-xs uppercase tracking-wider">{game.prizeTitle}</p>
                <p className="text-yellow-400 font-bold">{game.prizeAmount}</p>
              </div>
            </div>
          </div>
        )}

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
    .select(`
      username,
      lottery_number,
      is_scratched,
      lottery_games (
        name,
        entry_fee,
        prize_title,
        prize_amount
      )
    `)
    .eq('token', token)
    .single()

  if (error || !data) return <NotFound />

  type RawGame = { name: string; entry_fee: number; prize_title: string; prize_amount: string }
  const rawGame = (data.lottery_games as unknown) as RawGame | null

  const game: Game | null = rawGame
    ? {
        name: rawGame.name,
        entryFee: rawGame.entry_fee,
        prizeTitle: rawGame.prize_title,
        prizeAmount: rawGame.prize_amount,
      }
    : null

  if (data.is_scratched) {
    return (
      <AlreadyScratched
        username={data.username}
        lotteryNumber={data.lottery_number}
        game={game}
      />
    )
  }

  return (
    <ScratchCardView
      username={data.username}
      lotteryNumber={data.lottery_number}
      token={token}
      game={game}
    />
  )
}
