'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setSuccessMessage('Password updated successfully. Please sign in.')
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (rememberMe) {
      localStorage.setItem('tindlovu_remember_me', 'true')
    } else {
      localStorage.removeItem('tindlovu_remember_me')
    }
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 relative z-10">
      <Image
        src="/Logo.webp"
        alt="Tindlovu Documents"
        width={200}
        height={50}
        className="mx-auto mb-6"
      />
      <p className="text-sm text-slate-500 text-center mb-8">
        Sign in to your account
      </p>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="text-sm font-medium text-slate-700 mb-1 block">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="text-sm font-medium text-slate-700 mb-1 block">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-slate-700">Remember me</span>
          </label>
          <Link href="/auth/forgot-password" className="text-sm text-amber-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <Image
        src="/Elephant.jpg"
        alt=""
        fill
        className="object-cover object-center fixed inset-0 -z-10"
        priority
      />
      <div className="fixed inset-0 -z-10 bg-black/40 backdrop-blur-sm" />
      <Suspense fallback={
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 relative z-10">
          <Image src="/Logo.webp" alt="Tindlovu Documents" width={200} height={50} className="mx-auto mb-6" />
          <p className="text-sm text-slate-500 text-center">Loading...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
