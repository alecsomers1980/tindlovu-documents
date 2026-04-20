'use client'

import { useTransition } from 'react'
import { deleteBranch } from './actions'

export function DeleteBranchButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (
      !confirm(
        'Delete this branch? All its sections and documents will also be removed.',
      )
    )
      return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      await deleteBranch(fd)
    })
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
