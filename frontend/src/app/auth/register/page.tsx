'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { setToken, setUser } from '@/lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.username || form.username.length < 3) e.username = 'At least 3 characters'
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = 'Letters, numbers, underscores only'
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    if (!form.password || form.password.length < 8) e.password = 'At least 8 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
      })
      setToken(data.token)
      setUser(data.user)
      toast.success('Account created. Welcome to Agora.')
      router.push('/feed')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'username', label: 'Username', type: 'text', placeholder: 'your_handle' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
    { key: 'confirm', label: 'Confirm Password', type: 'password', placeholder: '••••••••' },
  ] as const

  return (
    <div className="animate-fade-up">
      <div className="mb-10">
        <span className="tag block mb-3">Join Agora</span>
        <h1 className="font-display text-4xl text-ink leading-tight">Create your<br />account</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="tag block mb-2">{field.label}</label>
            <input
              type={field.type}
              className={`input-field ${errors[field.key] ? 'border-accent' : ''}`}
              placeholder={field.placeholder}
              value={form[field.key]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            />
            {errors[field.key] && (
              <p className="mt-1 text-xs text-accent">{errors[field.key]}</p>
            )}
          </div>
        ))}

        <div className="pt-2">
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </div>
      </form>

      <div className="divider mt-8 pt-8">
        <p className="text-sm text-steel-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-ink underline underline-offset-4 hover:text-accent transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
