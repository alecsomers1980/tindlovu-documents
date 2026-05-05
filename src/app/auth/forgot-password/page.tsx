'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    })
    setLoading(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    setSent(true)
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
          Reset your password
        </h1>
        <p className="text-sm text-slate-500 text-center mb-8">
          {sent
            ? 'If an account exists for that email, we\'ve sent a reset link. Check your inbox.'
            : 'Enter your email and we\'ll send you a reset link.'}
        </p>

        {!sent && (
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

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="text-sm text-slate-500 text-center mt-6">
          <Link href="/login" className="text-amber-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
