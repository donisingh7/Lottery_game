'use client'
import { useState } from 'react'
import ScratchCard from './ScratchCard'

interface Game {
  name: string
  entryFee: number
  prizeTitle: string
  prizeAmount: string
}

interface Props {
  username: string
  lotteryNumber: string
  token: string
  game: Game | null
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function ScratchCardView({ username, lotteryNumber, token, game }: Props) {
  const [scratched, setScratched] = useState(false)

  const handleScratched = async () => {
    setScratched(true)
    try {
      await fetch(`/api/scratch/${token}`, { method: 'POST' })
    } catch {
      // Card is revealed client-side regardless
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black text-white">🃏 Scratch & Win</h1>
          <p className="text-gray-400 text-sm">
            Hey <span className="text-yellow-400 font-semibold">{username}</span>, you have a lucky card!
          </p>
        </div>

        {/* Game details banner */}
        {game && (
          <div className="bg-purple-950/40 border border-purple-800 rounded-2xl p-4 space-y-2">
            <p className="text-purple-300 font-semibold text-sm text-center">{game.name}</p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-gray-500 text-xs uppercase tracking-wider">Entry Fee</p>
                <p className="text-green-400 font-bold text-lg">{formatCurrency(game.entryFee)}</p>
              </div>
              <div className="w-px h-8 bg-gray-700" />
              <div className="text-center">
                <p className="text-gray-500 text-xs uppercase tracking-wider">{game.prizeTitle}</p>
                <p className="text-yellow-400 font-bold text-lg">{game.prizeAmount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Scratch card */}
        <div className="flex justify-center">
          <ScratchCard
            username={username}
            lotteryNumber={lotteryNumber}
            onScratched={handleScratched}
          />
        </div>

        {scratched ? (
          <div className="text-center space-y-1">
            <p className="text-green-400 font-semibold text-lg">🎉 Card Revealed!</p>
            <p className="text-gray-500 text-sm">Your lucky number is shown above</p>
          </div>
        ) : (
          <p className="text-center text-gray-600 text-xs">
            Use your finger or mouse to scratch the gold layer
          </p>
        )}

      </div>
    </div>
  )
}
