'use client'
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match.'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token: searchParams.get('token'), password })
      toast.success('Password reset! Please log in.')
      router.push('/auth/login')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Link expired or invalid.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-10">
        <span className="tag block mb-3">Account recovery</span>
        <h1 className="font-display text-4xl text-ink leading-tight">Reset your<br />password</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="tag block mb-2">New Password</label>
          <input type="password" className="input-field" placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label className="tag block mb-2">Confirm Password</label>
          <input type="password" className="input-field" placeholder="••••••••"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin inline mr-2" /> : null}
          Reset Password
        </button>
      </form>
    </div>
  )
}