'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function validatePassword(pw: string): string | null {
    if (pw.length < 8) return 'At least 8 characters'
    if (!/[A-Z]/.test(pw)) return 'At least one uppercase letter'
    if (!/[a-z]/.test(pw)) return 'At least one lowercase letter'
    if (!/[0-9]/.test(pw)) return 'At least one number'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const validationError = validatePassword(password)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    router.push('/login?reset=success')
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
          Set new password
        </h1>
        <p className="text-sm text-slate-500 text-center mb-8">
          Choose a strong password for your account.
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
            <ul className="mt-2 text-xs text-slate-500 space-y-0.5">
              <li className={password.length >= 8 ? 'text-green-600' : ''}>
                At least 8 characters
              </li>
              <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                One uppercase letter
              </li>
              <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                One lowercase letter
              </li>
              <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                One number
              </li>
            </ul>
          </div>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
