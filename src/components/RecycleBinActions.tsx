'use client'

import { restoreDocument, permanentDeleteDocument } from '@/lib/actions/documents'

export function RestoreButton({ documentId }: { documentId: string }) {
  return (
    <form action={restoreDocument} className="inline">
      <input type="hidden" name="documentId" value={documentId} />
      <button type="submit" className="text-sm text-amber-600 hover:underline">
        Restore
      </button>
    </form>
  )
}

export function PermanentDeleteButton({ documentId }: { documentId: string }) {
  async function handle(formData: FormData) {
    if (!confirm('Permanently delete this document? This cannot be undone.')) return
    await permanentDeleteDocument(formData)
  }
  return (
    <form action={handle} className="inline">
      <input type="hidden" name="documentId" value={documentId} />
      <button type="submit" className="text-sm text-red-600 hover:underline">
        Delete forever
      </button>
    </form>
  )
}
