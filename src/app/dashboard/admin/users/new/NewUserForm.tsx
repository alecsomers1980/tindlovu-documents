'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createUser, type State } from '../actions'

const initialState: State = { ok: false, error: null }

export default function NewUserForm() {
  const [state, formAction, isPending] = useActionState(createUser, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state.ok && state.newUserId) {
      const timer = setTimeout(() => {
        router.push(`/dashboard/admin/users/${state.newUserId}/edit`)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [state.ok, state.newUserId, router])

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.ok && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          Created — opening user…
        </div>
      )}

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-slate-700">
          Role
        </label>
        <select
          id="role"
          name="role"
          required
          defaultValue="user"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="user">User</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isPending ? 'Creating…' : 'Create user'}
      </button>
    </form>
  )
}
