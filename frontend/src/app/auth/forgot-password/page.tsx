'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div className="animate-fade-up text-center">
      <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
      <h1 className="font-display text-3xl mb-2">Check your email</h1>
      <p className="text-steel-400 text-sm mb-6">
        If that email exists, a reset link has been sent.
      </p>
      <Link href="/auth/login" className="btn-primary">Back to login</Link>
    </div>
  )

  return (
    <div className="animate-fade-up">
      <div className="mb-10">
        <span className="tag block mb-3">Account recovery</span>
        <h1 className="font-display text-4xl text-ink leading-tight">Forgot your<br />password?</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="tag block mb-2">Email</label>
          <input
            type="email"
            className="input-field"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading || !email}>
          {loading ? <Loader2 size={14} className="animate-spin inline mr-2" /> : null}
          Send Reset Link
        </button>
      </form>
      <div className="divider mt-8 pt-8">
        <Link href="/auth/login" className="text-sm text-steel-400 hover:text-ink transition-colors">
          ← Back to login
        </Link>
      </div>
    </div>
  )
}