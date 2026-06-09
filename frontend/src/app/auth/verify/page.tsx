'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import api from '@/lib/api'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) { setStatus('error'); return }
    api.get(`/auth/verify?token=${token}`)
      .then(() => { setStatus('success'); setTimeout(() => router.push('/auth/login'), 3000) })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="animate-fade-up text-center">
      {status === 'loading' && (
        <>
          <Loader2 size={48} className="animate-spin text-steel-400 mx-auto mb-4" />
          <h1 className="font-display text-3xl mb-2">Verifying...</h1>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
          <h1 className="font-display text-3xl mb-2">Email verified!</h1>
          <p className="text-steel-400 text-sm">Redirecting to login in 3 seconds...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle size={48} className="text-accent mx-auto mb-4" />
          <h1 className="font-display text-3xl mb-2">Invalid link</h1>
          <p className="text-steel-400 text-sm mb-6">This link is invalid or has expired.</p>
          <Link href="/auth/login" className="btn-primary">Back to login</Link>
        </>
      )}
    </div>
  )
}