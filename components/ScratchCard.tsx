'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

interface Props {
  lotteryNumber: string
  username: string
  onScratched: () => void
}

export default function ScratchCard({ lotteryNumber, username, onScratched }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const hasCalledBack = useRef(false)

  // Draw the gold scratch cover
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width: w, height: h } = canvas

    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#c6a028')
    grad.addColorStop(0.35, '#ffd700')
    grad.addColorStop(0.65, '#e6b800')
    grad.addColorStop(1, '#b8860b')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Dot texture overlay
    ctx.fillStyle = 'rgba(255,255,255,0.07)'
    for (let x = 15; x < w; x += 22) {
      for (let y = 15; y < h; y += 22) {
        ctx.beginPath()
        ctx.arc(x, y, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Scratch instruction text
    ctx.fillStyle = 'rgba(0,0,0,0.32)'
    ctx.font = 'bold 22px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('✨  SCRATCH HERE  ✨', w / 2, h / 2 - 16)
    ctx.font = '13px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    ctx.fillText('Use your finger or mouse to scratch', w / 2, h / 2 + 18)
  }, [])

  const getPos = useCallback(
    (e: MouseEvent | Touch, canvas: HTMLCanvasElement): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect()
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      }
    },
    []
  )

  const scratch = useCallback(
    (pos: { x: number; y: number }) => {
      const canvas = canvasRef.current
      if (!canvas || hasCalledBack.current) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = 55
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = 'rgba(0,0,0,1)'

      ctx.beginPath()
      if (lastPos.current) {
        ctx.moveTo(lastPos.current.x, lastPos.current.y)
        ctx.lineTo(pos.x, pos.y)
      } else {
        ctx.arc(pos.x, pos.y, 27, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.stroke()
      lastPos.current = pos

      // Sample every 4th pixel for performance
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let transparent = 0
      for (let i = 3; i < data.length; i += 16) {
        if (data[i] < 128) transparent++
      }
      const pct = transparent / (canvas.width * canvas.height / 4)

      if (pct > 0.55) {
        hasCalledBack.current = true
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setIsRevealed(true)
        onScratched()
      }
    },
    [onScratched]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onMouseDown = (e: MouseEvent) => {
      isDrawing.current = true
      lastPos.current = null
      scratch(getPos(e, canvas))
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDrawing.current) return
      scratch(getPos(e, canvas))
    }
    const onMouseUp = () => {
      isDrawing.current = false
      lastPos.current = null
    }
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      isDrawing.current = true
      lastPos.current = null
      scratch(getPos(e.touches[0], canvas))
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (!isDrawing.current) return
      scratch(getPos(e.touches[0], canvas))
    }
    const onTouchEnd = () => {
      isDrawing.current = false
      lastPos.current = null
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [scratch, getPos])

  return (
    <div className="relative w-full select-none" style={{ maxWidth: 420 }}>
      {/* Prize layer — always rendered beneath the canvas */}
      <div
        className={`w-full rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 flex flex-col items-center justify-center gap-3 shadow-2xl transition-transform duration-500 ${
          isRevealed ? 'scale-105' : ''
        }`}
        style={{ height: 260 }}
      >
        <p className="text-purple-300 text-xs uppercase tracking-widest font-medium">
          🎉 Congratulations, {username}!
        </p>
        <p
          className={`text-yellow-400 font-black text-7xl transition-all duration-300 ${
            isRevealed ? 'drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]' : ''
          }`}
        >
          {lotteryNumber}
        </p>
        <p className="text-purple-400 text-xs uppercase tracking-wider">Your Lucky Number</p>
      </div>

      {/* Canvas scratch overlay */}
      {!isRevealed && (
        <canvas
          ref={canvasRef}
          width={420}
          height={260}
          className="absolute inset-0 w-full h-full rounded-2xl cursor-crosshair touch-none"
        />
      )}

      {isRevealed && (
        <div className="absolute -top-3 -right-3 text-xl animate-spin" style={{ animationDuration: '3s' }}>
          ✨
        </div>
      )}
    </div>
  )
}
