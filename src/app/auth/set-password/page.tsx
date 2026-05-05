'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const needsPw = user.user_metadata?.needs_password_change
      if (!needsPw) { router.push('/dashboard'); return }
      setChecking(false)
    }
    check()
  }, [router])

  function validatePassword(pw: string): string | null {
    if (pw.length < 8) return 'At least 8 characters required'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const validationError = validatePassword(password)
    if (validationError) { setError(validationError); return }

    setLoading(true)
    const supabase = createClient()

    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { needs_password_change: false },
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // Also update the profiles table to clear the flag
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'user' })
        .eq('id', user.id)

      // If profile doesn't exist yet (trigger may not have fired), ignore
      void profileError
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-500 text-sm">Checking session...</div>
      </div>
    )
  }

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

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 relative z-10">
        <Image
          src="/Logo.webp"
          alt="Tindlovu Documents"
          width={200}
          height={50}
          className="mx-auto mb-6"
        />
        <h1 className="text-lg font-semibold text-slate-800 text-center mb-2">
          Set your password
        </h1>
        <p className="text-sm text-slate-500 text-center mb-8">
          Your account requires a new password before you can continue.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="text-sm font-medium text-slate-700 mb-1 block">
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
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
            <p className={`mt-2 text-xs ${password.length >= 8 ? 'text-green-600' : 'text-slate-500'}`}>
              At least 8 characters
            </p>
          </div>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Setting password...' : 'Set password'}
          </button>
        </form>
      </div>
    </div>
  )
}
