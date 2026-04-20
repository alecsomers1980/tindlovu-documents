'use client'

import { useActionState, useEffect, useState } from 'react'
import type { Profile } from '@/lib/types'
import { updateUser } from '../../actions'

export default function EditUserForm({ profile }: { profile: Profile }) {
  const [state, formAction, isPending] = useActionState(updateUser, {
    ok: false,
    error: null as string | null,
  })
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (state.ok) {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [state])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">User Details</h2>
      </div>
      <form action={formAction} className="px-6 py-4 space-y-4">
        <input type="hidden" name="user_id" value={profile.id} />

        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            defaultValue={profile.full_name ?? ''}
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
            defaultValue={profile.role}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="user">User</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex justify-center rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
          {showSuccess && (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Saved
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
