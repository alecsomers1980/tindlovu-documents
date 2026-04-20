import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Document } from '@/lib/types'
import { RestoreButton, PermanentDeleteButton } from '@/components/RecycleBinActions'

type DeletedDoc = Document & {
  branches: { name: string; slug: string } | null
  sections: { name: string; slug: string } | null
}

function daysLeft(deletedAt: string): number {
  const deleted = new Date(deletedAt).getTime()
  const expires = deleted + 90 * 24 * 60 * 60 * 1000
  const ms = expires - Date.now()
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}

export default async function RecycleBinPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'super_admin') notFound()

  const { data } = await supabase
    .from('documents')
    .select('*, branches(name, slug), sections(name, slug)')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  const docs = (data ?? []) as DeletedDoc[]

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Recycle bin</h1>
        <p className="text-sm text-slate-500">
          Deleted documents are kept for 90 days before being permanently removed.
        </p>
      </div>

      {docs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-500">The recycle bin is empty.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Deleted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Auto-purge
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{doc.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {doc.branches?.name ?? '—'} / {doc.sections?.name ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {doc.deleted_at
                      ? new Date(doc.deleted_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {doc.deleted_at ? `${daysLeft(doc.deleted_at)} days` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right space-x-4">
                    <RestoreButton documentId={doc.id} />
                    <PermanentDeleteButton documentId={doc.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
