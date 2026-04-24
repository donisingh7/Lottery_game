'use client'
import { useState } from 'react'

type Card = {
  username: string
  lotteryNumber: string
  link: string
  isScratched: boolean
  createdAt: string
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

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [username, setUsername] = useState('')
  const [lotteryNumber, setLotteryNumber] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [copied, setCopied] = useState<number | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null)

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!password.trim()) {
      setAuthError('Please enter the password')
      return
    }
    setAuthLoading(true)
    setAuthError('')

    try {
      const res = await fetch(`/api/cards?password=${encodeURIComponent(password)}`)
      if (res.status === 401) {
        setAuthError('Wrong password. Please try again.')
        setAuthLoading(false)
        return
      }
      const data = await res.json()
      const loaded: Card[] = (data.cards ?? []).map(
        (c: { username: string; lottery_number: string; token: string; is_scratched: boolean; created_at: string }) => ({
          username: c.username,
          lotteryNumber: c.lottery_number,
          link: `${window.location.origin}/scratch/${c.token}`,
          isScratched: c.is_scratched,
          createdAt: c.created_at,
        })
      )
      setCards(loaded)
      setAuthed(true)
    } catch {
      setAuthError('Network error. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const createCard = async (force = false) => {
    setFormError('')
    setCreating(true)

    try {
      const res = await fetch('/api/create-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, lotteryNumber, password, force }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          setAuthed(false)
          setAuthError('Session expired. Please log in again.')
        } else if (res.status === 409 && data.error === 'username_taken') {
          setDuplicateWarning({ username, lotteryNumber, existingDate: data.existingDate })
        } else {
          setFormError(data.error || 'Something went wrong')
        }
        return
      }

      const now = new Date().toISOString()
      const link = `${window.location.origin}/scratch/${data.token}`
      setCards((prev) => [{ username, lotteryNumber, link, isScratched: false, createdAt: now }, ...prev])
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

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">🃏 Lottery Admin</h1>
            <p className="text-gray-500 text-sm">Create scratch cards for your users</p>
          </div>
          <button
            onClick={() => { setAuthed(false); setPassword(''); setCards([]) }}
            className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Create Card Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Create New Scratch Card</h2>
          <form onSubmit={handleCreate} className="space-y-3">
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
        </div>

        {/* Duplicate Username Warning */}
        {duplicateWarning && (
          <div className="bg-amber-950/40 border border-amber-700 rounded-2xl p-5 space-y-4">
            <div className="flex gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-amber-300 font-semibold">Username already exists</p>
                <p className="text-amber-400/80 text-sm mt-1">
                  <span className="font-medium text-amber-300">{duplicateWarning.username}</span> already
                  has a card created on{' '}
                  <span className="font-medium text-amber-300">
                    {formatDate(duplicateWarning.existingDate)}
                  </span>
                  . Do you still want to create another card for this user?
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

        {/* All Cards */}
        {cards.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">All Cards</h2>
              <span className="text-gray-600 text-sm">{cards.length} total</span>
            </div>
            {cards.map((card, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-white font-medium">{card.username}</p>
                    <p className="text-gray-500 text-sm">
                      Number:{' '}
                      <span className="text-yellow-400 font-semibold">{card.lotteryNumber}</span>
                    </p>
                    <p className="text-gray-700 text-xs mt-0.5">{formatDate(card.createdAt)}</p>
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
                      `Hey ${card.username}! 🎰 You have a lucky scratch card waiting for you: ${card.link}`
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
          </div>
        )}

        {cards.length === 0 && (
          <div className="text-center py-12 text-gray-700">
            <p className="text-4xl mb-3">🎫</p>
            <p>No cards created yet. Generate your first one above.</p>
          </div>
        )}
      </div>
    </div>
  )
}
