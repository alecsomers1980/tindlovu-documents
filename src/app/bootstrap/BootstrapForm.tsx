'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { bootstrapSuperAdmin } from './actions'

export default function BootstrapForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(bootstrapSuperAdmin, {
    ok: false,
    error: null as string | null,
  })

  useEffect(() => {
    if (state.ok) {
      const timer = setTimeout(() => router.push('/login'), 2000)
      return () => clearTimeout(timer)
    }
  }, [state.ok, router])

  if (state.ok) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-green-600 font-medium">
          Success — redirecting to login
        </p>
      </div>
    )
  }

  return (
    <form action={formAction}>
      <div className="mb-4">
        <label htmlFor="full_name" className="text-sm font-medium text-slate-700 mb-1 block">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="bootstrap-email" className="text-sm font-medium text-slate-700 mb-1 block">
          Email
        </label>
        <input
          id="bootstrap-email"
          name="email"
          type="email"
          required
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="bootstrap-password" className="text-sm font-medium text-slate-700 mb-1 block">
          Password
        </label>
        <input
          id="bootstrap-password"
          name="password"
          type="password"
          minLength={8}
          required
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        />
      </div>
      {state.error && <p className="text-sm text-red-600 mt-2 mb-4">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-amber-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
      >
        {isPending ? 'Creating...' : 'Create super admin'}
      </button>
    </form>
  )
}
