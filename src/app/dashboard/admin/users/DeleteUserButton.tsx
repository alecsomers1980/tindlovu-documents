'use client'

import { useTransition } from 'react'
import { deleteUser } from './actions'

export function DeleteUserButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!confirm('Are you sure you want to delete this user?')) return
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          await deleteUser(fd)
        })
      }}
      className="inline"
    >
      <input type="hidden" name="user_id" value={userId} />
      <button
        type="submit"
        disabled={isPending}
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        {isPending ? 'Deleting…' : 'Delete'}
      </button>
    </form>
  )
}
