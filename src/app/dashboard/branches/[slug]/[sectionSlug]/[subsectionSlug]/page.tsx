import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import type { Branch, Section, Document } from '@/lib/types'
import { UploadDocumentDialog } from '@/components/UploadDocumentDialog'
import { DeleteDocumentButton } from '@/components/DeleteDocumentButton'
import { SectionAdminControls } from '@/components/SectionAdminControls'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

export default async function SubsectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; sectionSlug: string; subsectionSlug: string }>
  searchParams: Promise<{ q?: string; month?: string; year?: string; uploaded_by?: string }>
}) {
  const { slug, sectionSlug, subsectionSlug } = await params
  const sp = await searchParams
  const q = sp.q?.trim() ?? ''
  const month = sp.month ?? ''
  const year = sp.year ?? ''
  const uploadedBy = sp.uploaded_by ?? ''

  const { profile } = await requireAuth()
  const supabase = await createClient()

  const { data: branch } = await supabase
    .from('branches')
    .select('*')
    .eq('slug', slug)
    .single<Branch>()
  if (!branch) notFound()

  const { data: parent } = await supabase
    .from('sections')
    .select('*')
    .eq('slug', sectionSlug)
    .eq('branch_id', branch.id)
    .is('parent_id', null)
    .single<Section>()
  if (!parent) notFound()

  const { data: section } = await supabase
    .from('sections')
    .select('*')
    .eq('slug', subsectionSlug)
    .eq('parent_id', parent.id)
    .single<Section>()
  if (!section) notFound()

  const isSuperAdmin = profile.role === 'super_admin'
  let canUpload = isSuperAdmin
  if (!canUpload) {
    const { data: perm } = await supabase
      .from('permissions')
      .select('can_upload')
      .eq('user_id', profile.id)
      .eq('section_id', section.id)
      .maybeSingle()
    canUpload = !!perm?.can_upload
  }

  const path = `/dashboard/branches/${branch.slug}/${parent.slug}/${section.slug}`

  // Fetch all uploaders for the dropdown (unfiltered)
  const { data: allDocsForUploaders } = await supabase
    .from('documents')
    .select('uploaded_by')
    .eq('section_id', section.id)
    .is('deleted_at', null)
    .eq('status', 'ready')
  const allUploaderIds = [...new Set((allDocsForUploaders ?? []).map((d) => d.uploaded_by).filter(Boolean) as string[])]
  const allUploaders = new Map<string, string>()
  if (allUploaderIds.length > 0) {
    const { data: uploaderRows } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', allUploaderIds)
    for (const row of uploaderRows ?? []) {
      allUploaders.set(row.id, row.full_name ?? row.email ?? '—')
    }
  }

  let query = supabase
    .from('documents')
    .select('*')
    .eq('section_id', section.id)
    .is('deleted_at', null)
    .eq('status', 'ready')

  if (q) query = query.ilike('name', `%${q}%`)

  if (uploadedBy) {
    query = query.eq('uploaded_by', uploadedBy)
  }

  if (year) {
    const y = Number(year)
    if (!Number.isNaN(y)) {
      if (month) {
        const m = Number(month)
        if (m >= 1 && m <= 12) {
          const mStr = String(m).padStart(2, '0')
          const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
          const firstDate = `${y}-${mStr}-01`
          const lastDate = `${y}-${mStr}-${String(lastDay).padStart(2, '0')}`
          query = query.gte('document_date', firstDate).lte('document_date', lastDate)
        }
      } else {
        query = query.gte('document_date', `${y}-01-01`).lte('document_date', `${y}-12-31`)
      }
    }
  }

  const { data: documentsData } = await query.order('document_date', { ascending: false })
  const documents = (documentsData ?? []) as Document[]

  const uploaderIds = [...new Set(documents.map((d) => d.uploaded_by).filter((v): v is string => !!v))]
  const uploaders = new Map<string, string>()
  if (uploaderIds.length > 0) {
    const { data: uploaderRows } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', uploaderIds)
    for (const row of uploaderRows ?? []) {
      uploaders.set(row.id, row.full_name ?? row.email ?? '—')
    }
  }

  return (
    <div className="p-8 space-y-6">
      <Link
        href={`/dashboard/branches/${branch.slug}/${parent.slug}`}
        className="text-sm text-amber-600 hover:underline"
      >
        ← {parent.name}
      </Link>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{section.name}</h1>
          <p className="text-sm text-slate-500">
            {branch.name} / {parent.name}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isSuperAdmin && (
            <SectionAdminControls
              sectionId={section.id}
              branchId={branch.id}
              sectionName={section.name}
              sectionSlug={section.slug}
              path={path}
            />
          )}
          {canUpload && <UploadDocumentDialog sectionId={section.id} path={path} />}
        </div>
      </div>

      <form
        method="get"
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap gap-3 items-end"
      >
        <input
          type="text"
          name="q"
          placeholder="Search by name"
          defaultValue={q}
          className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          name="month"
          defaultValue={month}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Any month</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="year"
          placeholder="Year"
          min={2000}
          max={2100}
          defaultValue={year}
          className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          name="uploaded_by"
          defaultValue={uploadedBy}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm max-w-[200px]"
        >
          <option value="">Any uploader</option>
          {[...allUploaders.entries()]
            .sort(([, a], [, b]) => a.localeCompare(b))
            .map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Filter
        </button>
        {(q || month || year || uploadedBy) && (
          <Link href={path} className="text-sm text-slate-500 hover:underline self-center">
            Clear
          </Link>
        )}
      </form>
      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-500">No documents match your filters.</p>
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
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Uploaded by
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{doc.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(doc.document_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(doc.uploaded_at).toLocaleString('en-ZA', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {(doc.uploaded_by && uploaders.get(doc.uploaded_by)) ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {doc.size_bytes ? formatBytes(doc.size_bytes) : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right space-x-4">
                    <a
                      href={`/api/documents/${doc.id}/download`}
                      className="text-amber-600 hover:underline"
                    >
                      Download
                    </a>
                    {canUpload && <DeleteDocumentButton documentId={doc.id} path={path} />}
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
