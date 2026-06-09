'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken } from '@/lib/auth'

const WORD = 'FAILLINK'
const LETTER_DELAY = 120 // ms between each letter
const HOLD_DURATION = 800 // ms to hold after full word
const FADE_DURATION = 600 // ms for fade out

export default function SplashPage() {
  const router = useRouter()
  const [visibleCount, setVisibleCount] = useState(0)
  const [fading, setFading] = useState(false)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    // Type letters one by one
    const letterTimers: NodeJS.Timeout[] = []
    WORD.split('').forEach((_, i) => {
      letterTimers.push(
        setTimeout(() => setVisibleCount(i + 1), i * LETTER_DELAY)
      )
    })

    // After all letters, hold then fade
    const totalTypingTime = WORD.length * LETTER_DELAY
    const holdTimer = setTimeout(() => {
      setShowCursor(false)
      setFading(true)
    }, totalTypingTime + HOLD_DURATION)

    // Redirect after fade
    const redirectTimer = setTimeout(() => {
      const token = getToken()
      router.push(token ? '/feed' : '/auth/login')
    }, totalTypingTime + HOLD_DURATION + FADE_DURATION)

    return () => {
      letterTimers.forEach(clearTimeout)
      clearTimeout(holdTimer)
      clearTimeout(redirectTimer)
    }
  }, [])

  // Cursor blink
  useEffect(() => {
    if (!showCursor) return
    const interval = setInterval(() => {
      setShowCursor((v) => !v)
    }, 500)
    return () => clearInterval(interval)
  }, [showCursor])

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        backgroundColor: '#0D0D0D',
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_DURATION}ms ease`,
      }}
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(245,240,232,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,240,232,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Logo text */}
      <div className="relative z-10 flex items-center">
        <h1
          className="font-display text-paper"
          style={{
            fontSize: 'clamp(2.5rem, 10vw, 6rem)',
            letterSpacing: '0.15em',
            fontWeight: 700,
          }}
        >
          {WORD.split('').map((letter, i) => (
            <span
              key={i}
              style={{
                opacity: i < visibleCount ? 1 : 0,
                transition: 'opacity 0.15s ease',
                display: 'inline-block',
              }}
            >
              {letter}
            </span>
          ))}
        </h1>

        {/* Blinking cursor */}
        <span
          className="font-display text-accent"
          style={{
            fontSize: 'clamp(2.5rem, 10vw, 6rem)',
            fontWeight: 700,
            opacity: showCursor ? 1 : 0,
            transition: 'opacity 0.1s ease',
            marginLeft: '2px',
          }}
        >
          |
        </span>
      </div>

      {/* Tagline fades in after word is complete */}
      <p
        className="relative z-10 text-steel-400 tracking-widest uppercase font-display mt-4"
        style={{
          fontSize: 'clamp(0.6rem, 2vw, 0.75rem)',
          opacity: visibleCount === WORD.length ? 1 : 0,
          transition: 'opacity 0.8s ease',
          letterSpacing: '0.4em',
        }}
      >
        Share your thoughts
      </p>
    </div>
  )
}