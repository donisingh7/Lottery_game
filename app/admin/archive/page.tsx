'use client'
import { useState } from 'react'
import Link from 'next/link'

type Game = {
  id: string
  name: string
  entryFee: number
  prizeTitle: string
  prizeAmount: string
  revealDate: string | null
  createdAt: string
}

type Card = {
  token: string
  username: string
  lotteryNumber: string
  isScratched: boolean
  createdAt: string
  game: Game | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatRevealDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0,
  }).format(amount)
}

export default function ArchivePage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [games, setGames] = useState<Game[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [filterGameId, setFilterGameId] = useState('all')

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!password.trim()) { setAuthError('Please enter the password'); return }
    setAuthLoading(true); setAuthError('')

    try {
      const res = await fetch(`/api/archive?password=${encodeURIComponent(password)}`)
      if (res.status === 401) { setAuthError('Wrong password.'); setAuthLoading(false); return }

      const data = await res.json()

      const loadedGames: Game[] = (data.games ?? []).map((g: {
        id: string; name: string; entry_fee: number; prize_title: string
        prize_amount: string; reveal_date: string | null; created_at: string
      }) => ({
        id: g.id, name: g.name, entryFee: g.entry_fee,
        prizeTitle: g.prize_title, prizeAmount: g.prize_amount,
        revealDate: g.reveal_date, createdAt: g.created_at,
      }))

      const loadedCards: Card[] = (data.cards ?? []).map((c: {
        token: string; username: string; lottery_number: string
        is_scratched: boolean; created_at: string
        lottery_games: { id: string; name: string; entry_fee: number; prize_title: string; prize_amount: string; reveal_date: string | null } | null
      }) => ({
        token: c.token,
        username: c.username,
        lotteryNumber: c.lottery_number,
        isScratched: c.is_scratched,
        createdAt: c.created_at,
        game: c.lottery_games ? {
          id: c.lottery_games.id, name: c.lottery_games.name,
          entryFee: c.lottery_games.entry_fee, prizeTitle: c.lottery_games.prize_title,
          prizeAmount: c.lottery_games.prize_amount, revealDate: c.lottery_games.reveal_date,
          createdAt: '',
        } : null,
      }))

      setGames(loadedGames)
      setCards(loadedCards)
      setAuthed(true)
    } catch {
      setAuthError('Network error. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <p className="text-5xl">📦</p>
            <h1 className="text-2xl font-black text-white">Lottery Archive</h1>
            <p className="text-gray-500 text-sm">Enter admin password to view archived records</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password" autoFocus
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
              />
              {authError && <p className="text-red-400 text-sm mt-2">{authError}</p>}
            </div>
            <button type="submit" disabled={authLoading}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {authLoading ? 'Loading...' : 'View Archive'}
            </button>
          </form>
          <div className="text-center">
            <Link href="/admin" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const filtered =
    filterGameId === 'all' ? cards
    : filterGameId === 'none' ? cards.filter((c) => !c.game)
    : cards.filter((c) => c.game?.id === filterGameId)

  const selectedGame = games.find((g) => g.id === filterGameId)

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">📦 Archive</h1>
            <p className="text-gray-500 text-sm">
              {games.length} archived campaign{games.length !== 1 ? 's' : ''} · {cards.length} archived card{cards.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/admin" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
            ← Back to Admin
          </Link>
        </div>

        {/* Archived Games */}
        {games.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-white font-semibold">Archived Campaigns</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {games.map((game) => {
                const gameCards = cards.filter((c) => c.game?.id === game.id)
                const scratchedCount = gameCards.filter((c) => c.isScratched).length
                return (
                  <div key={game.id} className="px-6 py-4 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-gray-300 font-medium">{game.name}</p>
                        <p className="text-gray-600 text-xs">
                          {game.prizeTitle}: <span className="text-yellow-600">{game.prizeAmount}</span>
                          {' · '}Entry: <span className="text-green-700">{formatCurrency(game.entryFee)}</span>
                        </p>
                        {game.revealDate && (
                          <p className="text-purple-700 text-xs">🗓 Result date: {formatRevealDate(game.revealDate)}</p>
                        )}
                        <p className="text-gray-700 text-xs mt-0.5">Archived · Created {formatDate(game.createdAt)}</p>
                      </div>
                      <div className="shrink-0 text-right text-xs">
                        <p className="text-gray-600">{gameCards.length} cards</p>
                        <p className="text-gray-700">{scratchedCount} scratched</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {games.length === 0 && cards.length === 0 && (
          <div className="text-center py-16 text-gray-700">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-lg font-medium">Archive is empty</p>
            <p className="text-sm mt-1">Archived games and cards will appear here.</p>
          </div>
        )}

        {/* Archived Cards */}
        {cards.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-white font-semibold shrink-0">Archived Cards</h2>
              <select
                value={filterGameId} onChange={(e) => setFilterGameId(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-400 focus:outline-none focus:border-orange-500 transition-colors appearance-none"
              >
                <option value="all">All Campaigns ({cards.length})</option>
                {games.map((g) => {
                  const count = cards.filter((c) => c.game?.id === g.id).length
                  return <option key={g.id} value={g.id}>{g.name} ({count})</option>
                })}
                {cards.some((c) => !c.game) && (
                  <option value="none">No Campaign ({cards.filter((c) => !c.game).length})</option>
                )}
              </select>
            </div>

            {filterGameId !== 'all' && selectedGame && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-gray-400 font-medium text-sm">{selectedGame.name}</p>
                  <p className="text-gray-600 text-xs">
                    Entry {formatCurrency(selectedGame.entryFee)} · {selectedGame.prizeTitle}: {selectedGame.prizeAmount}
                    {selectedGame.revealDate && ` · 🗓 ${formatRevealDate(selectedGame.revealDate)}`}
                  </p>
                </div>
                <span className="text-gray-500 text-sm">{filtered.length} cards</span>
              </div>
            )}

            {filtered.map((card, i) => (
              <div key={i} className="bg-gray-900/60 border border-gray-800/60 rounded-xl p-4 space-y-2 opacity-80">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-gray-400 font-medium">{card.username}</p>
                    <p className="text-gray-600 text-sm">
                      Number: <span className="text-yellow-700 font-semibold">{card.lotteryNumber}</span>
                    </p>
                    {card.game && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="text-gray-600 bg-gray-800 border border-gray-700 text-xs px-2 py-0.5 rounded-full">
                          {card.game.name}
                        </span>
                        <span className="text-gray-600 bg-gray-800 border border-gray-700 text-xs px-2 py-0.5 rounded-full">
                          {formatCurrency(card.game.entryFee)}
                        </span>
                      </div>
                    )}
                    <p className="text-gray-700 text-xs mt-1">{formatDate(card.createdAt)}</p>
                  </div>
                  {card.isScratched ? (
                    <span className="shrink-0 bg-gray-800 text-gray-600 text-xs px-2 py-1 rounded-full border border-gray-700">Scratched</span>
                  ) : (
                    <span className="shrink-0 bg-gray-800 text-gray-600 text-xs px-2 py-1 rounded-full border border-gray-700">Unscratched</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
