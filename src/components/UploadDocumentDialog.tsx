'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { UploadCloud, FileCheck, X } from 'lucide-react'
import { uploadDocument } from '@/lib/actions/documents'

type UploadState = { ok: true } | { ok: false; error: string } | null

async function uploadAction(_prev: UploadState, formData: FormData): Promise<UploadState> {
  return await uploadDocument(formData)
}

export function UploadDocumentDialog({
  sectionId,
  path,
}: {
  sectionId: string
  path: string
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState<UploadState, FormData>(uploadAction, null)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (state && state.ok) {
      setOpen(false)
      setSelectedFile(null)
      formRef.current?.reset()
    }
  }, [state])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
  }

  const clearFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedFile(null)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
      >
        Upload document
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Upload document</h2>
            <form ref={formRef} action={formAction} className="space-y-4">
              <input type="hidden" name="sectionId" value={sectionId} />
              <input type="hidden" name="path" value={path} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  maxLength={200}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Document date
                </label>
                <input
                  type="date"
                  name="document_date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">File</label>

                {/* Hidden actual file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  name="file"
                  required
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Custom dropzone / browse button */}
                {selectedFile ? (
                  <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <FileCheck className="h-5 w-5 flex-shrink-0 text-amber-600" />
                    <span className="flex-1 truncate text-sm font-medium text-slate-800">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {selectedFile.size < 1024 * 1024
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                        : `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`}
                    </span>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="ml-1 rounded-full p-0.5 text-slate-400 hover:bg-amber-100 hover:text-slate-600 transition"
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 transition hover:border-amber-400 hover:bg-amber-50/50"
                  >
                    <UploadCloud className="h-8 w-8 text-slate-400 transition group-hover:text-amber-500" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-amber-700 transition">
                      Browse file
                    </span>
                    <span className="text-xs text-slate-400">
                      or drag and drop here
                    </span>
                  </button>
                )}

                <p className="text-xs text-slate-500 mt-1">Max 100 MB.</p>
              </div>
              {state && !state.ok && (
                <p className="text-sm text-red-600">{state.error}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={pending}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition"
                >
                  {pending ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
