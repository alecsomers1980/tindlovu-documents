'use client'

import { useActionState, useEffect, useState } from 'react'
import { updateBranch } from '../../actions'
import type { Branch } from '@/lib/types'

export function EditBranchForm({ branch }: { branch: Branch }) {
  const [state, formAction, isPending] = useActionState(updateBranch, {
    ok: false,
    error: null as string | null,
  })
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (state.ok) {
      setShowSuccess(true)
      const timeout = setTimeout(() => setShowSuccess(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [state])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Branch Details</h2>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={branch.id} />
        {state.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {state.error}
          </div>
        )}
        {showSuccess && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            Branch updated successfully
          </div>
        )}
        <div>
          <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700 mb-1">
            Name
          </label>
          <input
            id="edit-name"
            name="name"
            type="text"
            required
            defaultValue={branch.name}
            disabled={isPending}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="edit-slug" className="block text-sm font-medium text-slate-700 mb-1">
            Slug
          </label>
          <input
            id="edit-slug"
            name="slug"
            type="text"
            defaultValue={branch.slug}
            disabled={isPending}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
