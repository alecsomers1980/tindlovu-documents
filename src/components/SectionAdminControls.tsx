'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createSection, updateSection } from '@/app/dashboard/admin/branches/actions'
import { slugify } from '@/lib/slug'

type State = { ok: boolean; error: string | null; newId?: string }
const initial: State = { ok: false, error: null }

export function SectionAdminControls({
  sectionId,
  branchId,
  sectionName,
  sectionSlug,
  path,
}: {
  sectionId: string
  branchId: string
  sectionName: string
  sectionSlug: string
  path: string
}) {
  const [mode, setMode] = useState<'none' | 'edit' | 'new-sub'>('none')

  const [editState, editAction, editPending] = useActionState(updateSection, initial)
  const [createState, createAction, createPending] = useActionState(createSection, initial)

  const editFormRef = useRef<HTMLFormElement>(null)
  const createFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (editState.ok) setMode('none')
  }, [editState])

  useEffect(() => {
    if (createState.ok) {
      setMode('none')
      createFormRef.current?.reset()
    }
  }, [createState])

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('new-sub')}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          New subsection
        </button>
        <button
          type="button"
          onClick={() => setMode('edit')}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Edit section
        </button>
      </div>

      {mode !== 'none' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === 'edit' ? 'Edit section' : 'New subsection'}
            </h2>
            {mode === 'edit' ? (
              <EditForm
                key={sectionId}
                formRef={editFormRef}
                action={editAction}
                pending={editPending}
                error={editState.error}
                sectionId={sectionId}
                name={sectionName}
                slug={sectionSlug}
                path={path}
                onCancel={() => setMode('none')}
              />
            ) : (
              <CreateForm
                formRef={createFormRef}
                action={createAction}
                pending={createPending}
                error={createState.error}
                branchId={branchId}
                parentId={sectionId}
                onCancel={() => setMode('none')}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}

function EditForm({
  formRef,
  action,
  pending,
  error,
  sectionId,
  name,
  slug,
  path,
  onCancel,
}: {
  formRef: React.RefObject<HTMLFormElement | null>
  action: (fd: FormData) => void
  pending: boolean
  error: string | null
  sectionId: string
  name: string
  slug: string
  path: string
  onCancel: () => void
}) {
  const [n, setN] = useState(name)
  const [s, setS] = useState(slug)
  const [slugDirty, setSlugDirty] = useState(false)

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="id" value={sectionId} />
      <input type="hidden" name="path" value={path} />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
        <input
          type="text"
          name="name"
          required
          value={n}
          onChange={(e) => {
            setN(e.target.value)
            if (!slugDirty) setS(slugify(e.target.value))
          }}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
        <input
          type="text"
          name="slug"
          value={s}
          onChange={(e) => {
            setSlugDirty(true)
            setS(e.target.value)
          }}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function CreateForm({
  formRef,
  action,
  pending,
  error,
  branchId,
  parentId,
  onCancel,
}: {
  formRef: React.RefObject<HTMLFormElement | null>
  action: (fd: FormData) => void
  pending: boolean
  error: string | null
  branchId: string
  parentId: string
  onCancel: () => void
}) {
  const [n, setN] = useState('')
  const [s, setS] = useState('')
  const [slugDirty, setSlugDirty] = useState(false)

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="branch_id" value={branchId} />
      <input type="hidden" name="parent_id" value={parentId} />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
        <input
          type="text"
          name="name"
          required
          value={n}
          onChange={(e) => {
            setN(e.target.value)
            if (!slugDirty) setS(slugify(e.target.value))
          }}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
        <input
          type="text"
          name="slug"
          value={s}
          onChange={(e) => {
            setSlugDirty(true)
            setS(e.target.value)
          }}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? 'Creating…' : 'Create'}
        </button>
      </div>
    </form>
  )
}
