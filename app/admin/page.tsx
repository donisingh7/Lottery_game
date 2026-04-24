'use client'
import { useState } from 'react'

type Game = {
  id: string
  name: string
  entryFee: number
  prizeTitle: string
  prizeAmount: string
  createdAt: string
}

type Card = {
  username: string
  lotteryNumber: string
  link: string
  isScratched: boolean
  createdAt: string
  game: Game | null
}

type DuplicateWarning = {
  username: string
  lotteryNumber: string
  existingDate: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function AdminPage() {
  // Auth
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Games
  const [games, setGames] = useState<Game[]>([])
  const [showGameForm, setShowGameForm] = useState(false)
  const [gameName, setGameName] = useState('')
  const [entryFee, setEntryFee] = useState('')
  const [prizeTitle, setPrizeTitle] = useState('')
  const [prizeAmount, setPrizeAmount] = useState('')
  const [gameFormError, setGameFormError] = useState('')
  const [creatingGame, setCreatingGame] = useState(false)

  // Cards
  const [cards, setCards] = useState<Card[]>([])
  const [selectedGameId, setSelectedGameId] = useState('')
  const [username, setUsername] = useState('')
  const [lotteryNumber, setLotteryNumber] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null)
  const [copied, setCopied] = useState<number | null>(null)
  const [filterGameId, setFilterGameId] = useState<string>('all')

  // ── Login ───────────────────────────────────────────────────────
  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!password.trim()) { setAuthError('Please enter the password'); return }
    setAuthLoading(true)
    setAuthError('')

    try {
      const enc = encodeURIComponent(password)
      const [cardsRes, gamesRes] = await Promise.all([
        fetch(`/api/cards?password=${enc}`),
        fetch(`/api/games?password=${enc}`),
      ])

      if (cardsRes.status === 401) {
        setAuthError('Wrong password. Please try again.')
        return
      }

      const [cardsData, gamesData] = await Promise.all([
        cardsRes.json(),
        gamesRes.json(),
      ])

      const loadedGames: Game[] = (gamesData.games ?? []).map((g: {
        id: string; name: string; entry_fee: number
        prize_title: string; prize_amount: string; created_at: string
      }) => ({
        id: g.id, name: g.name, entryFee: g.entry_fee,
        prizeTitle: g.prize_title, prizeAmount: g.prize_amount, createdAt: g.created_at,
      }))

      const loadedCards: Card[] = (cardsData.cards ?? []).map((c: {
        username: string; lottery_number: string; token: string
        is_scratched: boolean; created_at: string
        lottery_games: { id: string; name: string; entry_fee: number; prize_title: string; prize_amount: string } | null
      }) => ({
        username: c.username,
        lotteryNumber: c.lottery_number,
        link: `${window.location.origin}/scratch/${c.token}`,
        isScratched: c.is_scratched,
        createdAt: c.created_at,
        game: c.lottery_games
          ? { id: c.lottery_games.id, name: c.lottery_games.name, entryFee: c.lottery_games.entry_fee, prizeTitle: c.lottery_games.prize_title, prizeAmount: c.lottery_games.prize_amount, createdAt: '' }
          : null,
      }))

      setGames(loadedGames)
      setCards(loadedCards)
      if (loadedGames.length > 0) setSelectedGameId(loadedGames[0].id)
      setAuthed(true)
    } catch {
      setAuthError('Network error. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  // ── Create Game ─────────────────────────────────────────────────
  const handleCreateGame = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setGameFormError('')
    setCreatingGame(true)

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, name: gameName, entryFee, prizeTitle, prizeAmount }),
      })
      const data = await res.json()

      if (!res.ok) {
        setGameFormError(data.error || 'Failed to create game')
        return
      }

      const g = data.game
      const newGame: Game = {
        id: g.id, name: g.name, entryFee: g.entry_fee,
        prizeTitle: g.prize_title, prizeAmount: g.prize_amount, createdAt: g.created_at,
      }
      setGames((prev) => [newGame, ...prev])
      if (!selectedGameId) setSelectedGameId(newGame.id)
      setGameName(''); setEntryFee(''); setPrizeTitle(''); setPrizeAmount('')
      setShowGameForm(false)
    } catch {
      setGameFormError('Network error. Please try again.')
    } finally {
      setCreatingGame(false)
    }
  }

  // ── Create Card ─────────────────────────────────────────────────
  const createCard = async (force = false) => {
    setFormError('')
    setCreating(true)

    try {
      const res = await fetch('/api/create-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, lotteryNumber, password, force, gameId: selectedGameId || null }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) { setAuthed(false); setAuthError('Session expired. Please log in again.') }
        else if (res.status === 409 && data.error === 'username_taken') {
          setDuplicateWarning({ username, lotteryNumber, existingDate: data.existingDate })
        } else {
          setFormError(data.error || 'Something went wrong')
        }
        return
      }

      const game = games.find((g) => g.id === selectedGameId) ?? null
      const link = `${window.location.origin}/scratch/${data.token}`
      setCards((prev) => [{
        username, lotteryNumber, link, isScratched: false,
        createdAt: new Date().toISOString(), game,
      }, ...prev])
      setUsername('')
      setLotteryNumber('')
    } catch {
      setFormError('Network error. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleCreate = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    await createCard(false)
  }

  const handleForceCreate = async () => {
    setDuplicateWarning(null)
    await createCard(true)
  }

  const copyLink = (link: string, idx: number) => {
    navigator.clipboard.writeText(link)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  // ── Login Screen ────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <p className="text-5xl">🃏</p>
            <h1 className="text-2xl font-black text-white">Lottery Admin</h1>
            <p className="text-gray-500 text-sm">Enter your password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                autoFocus
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
              />
              {authError && <p className="text-red-400 text-sm mt-2">{authError}</p>}
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {authLoading ? 'Loading...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Admin Dashboard ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">🃏 Lottery Admin</h1>
            <p className="text-gray-500 text-sm">Manage games and scratch cards</p>
          </div>
          <button
            onClick={() => { setAuthed(false); setPassword(''); setCards([]); setGames([]) }}
            className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
          >
            Logout
          </button>
        </div>

        {/* ── Section 1: Lottery Games ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <div>
              <h2 className="text-white font-semibold">Lottery Games</h2>
              <p className="text-gray-600 text-xs mt-0.5">{games.length} game{games.length !== 1 ? 's' : ''} created</p>
            </div>
            <button
              onClick={() => setShowGameForm((v) => !v)}
              className="bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              {showGameForm ? '✕ Cancel' : '+ New Game'}
            </button>
          </div>

          {/* New game form */}
          {showGameForm && (
            <form onSubmit={handleCreateGame} className="px-6 py-4 border-b border-gray-800 space-y-3 bg-gray-950/50">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Create New Lottery Game</p>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Game name (e.g. Weekly Grand Draw)"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-yellow-500 transition-colors"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                  <input
                    type="number"
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value)}
                    placeholder="Entry fee"
                    min="0"
                    step="0.01"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-7 pr-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>
                <input
                  type="text"
                  value={prizeTitle}
                  onChange={(e) => setPrizeTitle(e.target.value)}
                  placeholder="Prize label (e.g. Cash Prize)"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
              <input
                type="text"
                value={prizeAmount}
                onChange={(e) => setPrizeAmount(e.target.value)}
                placeholder="Prize details (e.g. ₹50,000 Cash or iPhone 16 Pro)"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-yellow-500 transition-colors"
              />
              {gameFormError && <p className="text-red-400 text-xs">{gameFormError}</p>}
              <button
                type="submit"
                disabled={creatingGame}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {creatingGame ? 'Creating...' : '✨ Create Lottery Game'}
              </button>
            </form>
          )}

          {/* Games list */}
          {games.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-700">
              <p className="text-2xl mb-2">🎲</p>
              <p className="text-sm">No games yet. Create your first lottery game above.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {games.map((game) => (
                <div key={game.id} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{game.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {game.prizeTitle}:{' '}
                      <span className="text-yellow-400">{game.prizeAmount}</span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-green-400 text-xs font-semibold">
                      Entry {formatCurrency(game.entryFee)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Section 2: Create Scratch Card ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Create Scratch Card</h2>

          {games.length === 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-sm">Create a lottery game first before generating cards.</p>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-3">
              {/* Game selector */}
              <div>
                <label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">
                  Select Lottery Game
                </label>
                <select
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors appearance-none"
                >
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — Entry {formatCurrency(g.entryFee)} — {g.prizeTitle}: {g.prizeAmount}
                    </option>
                  ))}
                </select>

                {/* Selected game preview */}
                {selectedGameId && (() => {
                  const g = games.find((x) => x.id === selectedGameId)
                  return g ? (
                    <div className="mt-2 flex gap-3 text-xs">
                      <span className="text-green-400 bg-green-900/20 border border-green-900 px-2 py-1 rounded-lg">
                        Entry: {formatCurrency(g.entryFee)}
                      </span>
                      <span className="text-yellow-400 bg-yellow-900/20 border border-yellow-900 px-2 py-1 rounded-lg">
                        {g.prizeTitle}: {g.prizeAmount}
                      </span>
                    </div>
                  ) : null
                })()}
              </div>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="User name (e.g. John Doe)"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
              />
              <input
                type="text"
                value={lotteryNumber}
                onChange={(e) => setLotteryNumber(e.target.value)}
                placeholder="Lottery number (e.g. 4728)"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
              />
              {formError && <p className="text-red-400 text-sm">{formError}</p>}
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Generating...' : '✨ Generate Scratch Card Link'}
              </button>
            </form>
          )}
        </div>

        {/* ── Duplicate Warning ── */}
        {duplicateWarning && (
          <div className="bg-amber-950/40 border border-amber-700 rounded-2xl p-5 space-y-4">
            <div className="flex gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-amber-300 font-semibold">Username already exists</p>
                <p className="text-amber-400/80 text-sm mt-1">
                  <span className="font-medium text-amber-300">{duplicateWarning.username}</span> already
                  has a card from{' '}
                  <span className="font-medium text-amber-300">
                    {formatDate(duplicateWarning.existingDate)}
                  </span>
                  . Create another one anyway?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDuplicateWarning(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleForceCreate}
                disabled={creating}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-medium py-2 rounded-xl transition-colors text-sm disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Yes, Create Anyway'}
              </button>
            </div>
          </div>
        )}

        {/* ── Section 3: All Cards ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-white font-semibold shrink-0">Card History</h2>
            <select
              value={filterGameId}
              onChange={(e) => setFilterGameId(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-yellow-500 transition-colors appearance-none"
            >
              <option value="all">All Campaigns ({cards.length})</option>
              {games.map((g) => {
                const count = cards.filter((c) => c.game?.id === g.id).length
                return (
                  <option key={g.id} value={g.id}>
                    {g.name} ({count})
                  </option>
                )
              })}
              {cards.some((c) => !c.game) && (
                <option value="none">No Campaign ({cards.filter((c) => !c.game).length})</option>
              )}
            </select>
          </div>

          {(() => {
            const filtered =
              filterGameId === 'all'
                ? cards
                : filterGameId === 'none'
                ? cards.filter((c) => !c.game)
                : cards.filter((c) => c.game?.id === filterGameId)

            const selectedGame = games.find((g) => g.id === filterGameId)

            return filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-700">
                <p className="text-4xl mb-3">🎫</p>
                <p>
                  {cards.length === 0
                    ? 'No cards yet. Generate your first one above.'
                    : `No cards found for "${selectedGame?.name ?? 'this campaign'}".`}
                </p>
              </div>
            ) : (
              <>
                {filterGameId !== 'all' && selectedGame && (
                  <div className="bg-purple-950/30 border border-purple-800/50 rounded-xl px-4 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 font-medium text-sm">{selectedGame.name}</p>
                      <p className="text-gray-500 text-xs">
                        Entry {formatCurrency(selectedGame.entryFee)} · {selectedGame.prizeTitle}: {selectedGame.prizeAmount}
                      </p>
                    </div>
                    <span className="text-purple-400 text-sm font-semibold">{filtered.length} cards</span>
                  </div>
                )}
                {filtered.map((card, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-white font-medium">{card.username}</p>
                    <p className="text-gray-500 text-sm">
                      Number:{' '}
                      <span className="text-yellow-400 font-semibold">{card.lotteryNumber}</span>
                    </p>
                    {card.game && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="text-purple-300 bg-purple-900/20 border border-purple-900 text-xs px-2 py-0.5 rounded-full">
                          {card.game.name}
                        </span>
                        <span className="text-green-400 bg-green-900/20 border border-green-900 text-xs px-2 py-0.5 rounded-full">
                          Entry {formatCurrency(card.game.entryFee)}
                        </span>
                        <span className="text-yellow-400 bg-yellow-900/20 border border-yellow-900 text-xs px-2 py-0.5 rounded-full">
                          {card.game.prizeTitle}: {card.game.prizeAmount}
                        </span>
                      </div>
                    )}
                    <p className="text-gray-700 text-xs mt-1">{formatDate(card.createdAt)}</p>
                  </div>
                  {card.isScratched ? (
                    <span className="shrink-0 bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full border border-gray-700">
                      Scratched
                    </span>
                  ) : (
                    <span className="shrink-0 bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded-full border border-green-800">
                      Pending
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={card.link}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-gray-400 text-xs font-mono min-w-0"
                  />
                  <button
                    onClick={() => copyLink(card.link, i)}
                    className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {copied === i ? '✓ Copied' : 'Copy'}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Hey ${card.username}! 🎰 You have a lucky scratch card for the ${card.game?.name ?? 'lottery'}. Open and scratch to reveal your number: ${card.link}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </>
        )
      })()}
        </div>

      </div>
    </div>
  )
}
