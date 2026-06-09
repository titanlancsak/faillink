'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { setToken, setUser } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      setToken(data.token)
      setUser(data.user)
      toast.success('Welcome back.')
      router.push('/feed')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-10">
        <span className="tag block mb-3">Welcome back</span>
        <h1 className="font-display text-4xl text-ink leading-tight">Sign in to<br />your account</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="tag block mb-2">Email</label>
          <input
            type="email"
            className={`input-field ${errors.email ? 'border-accent' : ''}`}
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {errors.email && <p className="mt-1 text-xs text-accent">{errors.email}</p>}
        </div>

        <div>
          <label className="tag block mb-2">Password</label>
          <input
            type="password"
            className={`input-field ${errors.password ? 'border-accent' : ''}`}
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {errors.password && <p className="mt-1 text-xs text-accent">{errors.password}</p>}
        </div>

        <div className="pt-2">
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </form>

      <div className="divider mt-8 pt-8">
        <p className="text-sm text-steel-400">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-ink underline underline-offset-4 hover:text-accent transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
