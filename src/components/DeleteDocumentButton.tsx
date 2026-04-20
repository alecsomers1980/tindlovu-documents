'use client'

import { softDeleteDocument } from '@/lib/actions/documents'

export function DeleteDocumentButton({
  documentId,
  path,
}: {
  documentId: string
  path: string
}) {
  async function handle(formData: FormData) {
    if (!confirm('Move this document to the recycle bin?')) return
    await softDeleteDocument(formData)
  }

  return (
    <form action={handle} className="inline">
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="path" value={path} />
      <button type="submit" className="text-sm text-red-600 hover:underline">
        Delete
      </button>
    </form>
  )
}
