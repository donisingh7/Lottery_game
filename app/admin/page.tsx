'use client'
import { useState } from 'react'

type Card = { username: string; lotteryNumber: string; link: string }

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')

  const [username, setUsername] = useState('')
  const [lotteryNumber, setLotteryNumber] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [copied, setCopied] = useState<number | null>(null)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setAuthError('Please enter the password')
      return
    }
    setAuthed(true)
    setAuthError('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setCreating(true)

    try {
      const res = await fetch('/api/create-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, lotteryNumber, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          setAuthed(false)
          setAuthError('Wrong password. Please try again.')
        } else {
          setFormError(data.error || 'Something went wrong')
        }
        return
      }

      const link = `${window.location.origin}/scratch/${data.token}`
      setCards((prev) => [{ username, lotteryNumber, link }, ...prev])
      setUsername('')
      setLotteryNumber('')
    } catch {
      setFormError('Network error. Please try again.')
    } finally {
      setCreating(false)
    }
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
            <p className="text-5xl">🎰</p>
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
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition-colors"
            >
              Login
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
            <h1 className="text-2xl font-black text-white">🎰 Lottery Admin</h1>
            <p className="text-gray-500 text-sm">Create scratch cards for your users</p>
          </div>
          <button
            onClick={() => { setAuthed(false); setPassword(''); setCards([]) }}
            className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
          >
            Logout
          </button>
        </div>

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

        {cards.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-white font-semibold">
              Generated Cards{' '}
              <span className="text-gray-600 font-normal text-sm">(this session)</span>
            </h2>
            {cards.map((card, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{card.username}</p>
                    <p className="text-gray-500 text-sm">
                      Number:{' '}
                      <span className="text-yellow-400 font-semibold">{card.lotteryNumber}</span>
                    </p>
                  </div>
                  <span className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded-full border border-green-800">
                    Created
                  </span>
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
      </div>
    </div>
  )
}
