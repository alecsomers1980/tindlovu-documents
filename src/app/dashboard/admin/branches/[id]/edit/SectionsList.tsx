'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { createSection, deleteSection, updateSection } from '../../actions'
import { slugify } from '@/lib/slug'
import type { Section } from '@/lib/types'

type State = { ok: boolean; error: string | null; newId?: string }
const initial: State = { ok: false, error: null }

export function SectionsList({
  branchId,
  sections,
}: {
  branchId: string
  sections: Section[]
}) {
  const [isPendingDelete, startDeleteTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [createState, createAction, createPending] = useActionState(createSection, initial)
  const [editState, editAction, editPending] = useActionState(updateSection, initial)

  const [formKey, setFormKey] = useState(0)
  const [nameInput, setNameInput] = useState('')
  const [slugInput, setSlugInput] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [parentId, setParentId] = useState<string>('')
  const lastResetId = useRef<string | undefined>(undefined)

  const [editing, setEditing] = useState<Section | null>(null)

  useEffect(() => {
    if (
      createState.ok &&
      createState.newId &&
      createState.newId !== lastResetId.current
    ) {
      lastResetId.current = createState.newId
      setNameInput('')
      setSlugInput('')
      setSlugManuallyEdited(false)
      setParentId('')
      setFormKey((k) => k + 1)
    }
  }, [createState.ok, createState.newId])

  useEffect(() => {
    if (editState.ok) setEditing(null)
  }, [editState])

  function handleDelete(id: string, hasChildren: boolean) {
    const msg = hasChildren
      ? 'Delete this section and ALL its subsections/documents?'
      : 'Delete this section? Documents within it will also be removed.'
    if (!confirm(msg)) return
    setDeletingId(id)
    startDeleteTransition(async () => {
      const fd = new FormData()
      fd.set('id', id)
      await deleteSection(fd)
      setDeletingId(null)
    })
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setNameInput(value)
    if (!slugManuallyEdited) setSlugInput(slugify(value))
  }

  const topLevel = sections.filter((s) => !s.parent_id)
  const childrenByParent = new Map<string, Section[]>()
  for (const s of sections) {
    if (s.parent_id) {
      const arr = childrenByParent.get(s.parent_id) ?? []
      arr.push(s)
      childrenByParent.set(s.parent_id, arr)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900">Sections</h2>
      <p className="text-sm text-slate-500 mt-1">
        Sections and subsections organize documents within this branch
      </p>

      {topLevel.length > 0 ? (
        <div className="mt-4 space-y-2">
          {topLevel.map((section) => {
            const kids = childrenByParent.get(section.id) ?? []
            return (
              <div key={section.id} className="rounded-lg border border-slate-200">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{section.name}</div>
                    <div className="text-xs font-mono text-slate-500">{section.slug}</div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <button
                      type="button"
                      onClick={() => setEditing(section)}
                      className="text-amber-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(section.id, kids.length > 0)}
                      disabled={isPendingDelete && deletingId === section.id}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      {isPendingDelete && deletingId === section.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
                {kids.length > 0 && (
                  <ul className="divide-y divide-slate-200">
                    {kids.map((k) => (
                      <li key={k.id} className="flex items-center justify-between px-4 py-2 pl-8">
                        <div>
                          <div className="text-sm text-slate-800">{k.name}</div>
                          <div className="text-xs font-mono text-slate-500">{k.slug}</div>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <button
                            type="button"
                            onClick={() => setEditing(k)}
                            className="text-amber-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(k.id, false)}
                            disabled={isPendingDelete && deletingId === k.id}
                            className="text-red-600 hover:underline disabled:opacity-50"
                          >
                            {isPendingDelete && deletingId === k.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-center">
          <p className="text-sm text-slate-500">No sections yet. Add the first one below.</p>
        </div>
      )}

      <div className="mt-6 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-medium text-slate-900 mb-3">Add Section / Subsection</h3>
        <form key={formKey} action={createAction} className="space-y-3">
          <input type="hidden" name="branch_id" value={branchId} />
          <input type="hidden" name="parent_id" value={parentId} />
          {createState.error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {createState.error}
            </div>
          )}
          <div className="flex gap-3 flex-wrap">
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              disabled={createPending}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">— Top level —</option>
              {topLevel.map((s) => (
                <option key={s.id} value={s.id}>
                  Under: {s.name}
                </option>
              ))}
            </select>
            <input
              name="name"
              type="text"
              required
              placeholder="Section name"
              value={nameInput}
              onChange={handleNameChange}
              disabled={createPending}
              className="flex-1 min-w-[160px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              name="slug"
              type="text"
              placeholder="Slug (auto)"
              value={slugInput}
              onChange={(e) => {
                setSlugManuallyEdited(true)
                setSlugInput(e.target.value)
              }}
              disabled={createPending}
              className="flex-1 min-w-[160px] rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={createPending}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 whitespace-nowrap"
            >
              {createPending ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      </div>

      {editing && (
        <EditModal
          key={editing.id}
          section={editing}
          action={editAction}
          pending={editPending}
          error={editState.error}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function EditModal({
  section,
  action,
  pending,
  error,
  onCancel,
}: {
  section: Section
  action: (fd: FormData) => void
  pending: boolean
  error: string | null
  onCancel: () => void
}) {
  const [n, setN] = useState(section.name)
  const [s, setS] = useState(section.slug)
  const [dirty, setDirty] = useState(false)

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Edit section</h2>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={section.id} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              required
              value={n}
              onChange={(e) => {
                setN(e.target.value)
                if (!dirty) setS(slugify(e.target.value))
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
                setDirty(true)
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
      </div>
    </div>
  )
}
