'use client'

import { useState, Suspense, useEffect, useRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { login } from './actions'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ThemeToggle'

// Animated canvas background
function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animFrameId: number
    let w = canvas.width = window.innerWidth
    let h = canvas.height = window.innerHeight

    const onResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    // Lines config
    const NUM_LINES = 12
    type Line = { x: number; y: number; vx: number; vy: number; len: number; opacity: number }
    const lines: Line[] = Array.from({ length: NUM_LINES }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      len: 60 + Math.random() * 100,
      opacity: 0.03 + Math.random() * 0.05,
    }))

    const NUM_DOTS = 50
    type Dot = { x: number; y: number; vx: number; vy: number; r: number }
    const dots: Dot[] = Array.from({ length: NUM_DOTS }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: 0.8 + Math.random() * 1.5,
    }))

    const CONNECT_DIST = 120

    function draw() {
      ctx.clearRect(0, 0, w, h)

      // Moving lines
      for (const ln of lines) {
        ln.x += ln.vx
        ln.y += ln.vy
        if (ln.x < -200) ln.x = w + 100
        if (ln.x > w + 200) ln.x = -100
        if (ln.y < -200) ln.y = h + 100
        if (ln.y > h + 200) ln.y = -100

        const angle = Math.atan2(ln.vy, ln.vx)
        ctx.beginPath()
        ctx.moveTo(ln.x, ln.y)
        ctx.lineTo(ln.x + Math.cos(angle) * ln.len, ln.y + Math.sin(angle) * ln.len)
        ctx.strokeStyle = `rgba(28, 100, 165, ${ln.opacity})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Dots
      for (const d of dots) {
        d.x += d.vx
        d.y += d.vy
        if (d.x < 0) d.x = w
        if (d.x > w) d.x = 0
        if (d.y < 0) d.y = h
        if (d.y > h) d.y = 0

        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(28, 100, 165, 0.12)'
        ctx.fill()
      }

      // Connections between dots
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x
          const dy = dots[i].y - dots[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECT_DIST) {
            ctx.beginPath()
            ctx.moveTo(dots[i].x, dots[i].y)
            ctx.lineTo(dots[j].x, dots[j].y)
            ctx.strokeStyle = `rgba(28, 100, 165, ${0.06 * (1 - dist / CONNECT_DIST)})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }

      animFrameId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animFrameId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  )
}

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-red-50 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950 flex flex-col justify-center items-center px-6 relative overflow-hidden transition-colors duration-300">

      {/* Animated canvas background */}
      <AnimatedBackground />

      {/* Theme toggle */}
      <ThemeToggle />

      {/* Soft gradient orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-300/20 dark:bg-red-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 p-8 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.3)] z-10 transition-all duration-300">

        {/* Logo Section */}
        <div className="flex justify-center items-center mb-10">
          <div className="relative w-[200px] h-[52px]">
            <Image
              src="/alfamidi-logo.png"
              alt="Alfamidi Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        <form action={login} className="space-y-6">
          {error && <p className="text-red-500 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg px-4 py-2">{error}</p>}
          {message && <p className="text-green-500 dark:text-green-400 text-sm text-center">{message}</p>}

          <div className="space-y-2">
            <label className="block text-[#0c539a] dark:text-blue-300 font-semibold text-sm">
              Enter your NIK
            </label>
            <input
              type="text"
              name="nik"
              required
              pattern="[0-9]{10}"
              maxLength={10}
              minLength={10}
              title="NIK harus tepat 10 digit angka"
              placeholder="1234567890"
              className="w-full border border-blue-200 dark:border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0c539a] dark:focus:ring-blue-500 text-gray-800 dark:text-gray-100 bg-white dark:bg-slate-800/50 placeholder-blue-200 dark:placeholder-slate-500 transition-colors"
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '')
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[#0c539a] dark:text-blue-300 font-semibold text-sm">
              Enter your password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                placeholder="***************"
                className="w-full border border-blue-200 dark:border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0c539a] dark:focus:ring-blue-500 text-gray-800 dark:text-gray-100 bg-white dark:bg-slate-800/50 placeholder-blue-200 dark:placeholder-slate-500 pr-12 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300 dark:text-slate-400 hover:text-blue-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#1c64a5] hover:bg-[#154d80] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors duration-200 mt-4 shadow-sm"
          >
            Login
          </button>

          <div className="text-right mt-2">
            <a href="#" className="text-[#1c64a5] dark:text-blue-400 text-sm hover:underline font-medium transition-colors">
              Lupa password?
            </a>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-slate-400">
          Belum punya akun? <a href="/register" className="text-[#1c64a5] dark:text-blue-400 font-semibold hover:underline transition-colors">Register</a>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
