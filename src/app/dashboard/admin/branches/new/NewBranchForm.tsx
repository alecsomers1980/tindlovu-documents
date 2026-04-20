'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBranch } from '../actions'
import { slugify } from '@/lib/slug'

export function NewBranchForm() {
  const [state, formAction, isPending] = useActionState(createBranch, {
    ok: false,
    error: null as string | null,
  })
  const router = useRouter()
  const [nameInput, setNameInput] = useState('')
  const [slugInput, setSlugInput] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  useEffect(() => {
    if (state.ok && state.newId) {
      const timeout = setTimeout(() => {
        router.push(`/dashboard/admin/branches/${state.newId}/edit`)
      }, 600)
      return () => clearTimeout(timeout)
    }
  }, [state.ok, state.newId, router])

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setNameInput(value)
    if (!slugManuallyEdited) setSlugInput(slugify(value))
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugManuallyEdited(true)
    setSlugInput(e.target.value)
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={nameInput}
          onChange={handleNameChange}
          disabled={isPending}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          value={slugInput}
          onChange={handleSlugChange}
          disabled={isPending}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-slate-500">
          Auto-generated from name. Used in URLs.
        </p>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {isPending ? 'Creating…' : 'Create branch'}
      </button>
    </form>
  )
}
