import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  await requireAuth()

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const branchId = searchParams.get('branch_id') ?? ''
  const sectionId = searchParams.get('section_id') ?? ''
  const uploadedBy = searchParams.get('uploaded_by') ?? ''
  const dateFrom = searchParams.get('date_from') ?? ''
  const dateTo = searchParams.get('date_to') ?? ''

  const supabase = await createClient()

  let query = supabase
    .from('documents')
    .select('id, name, original_filename, document_date, uploaded_at, size_bytes, uploaded_by, branch_id, section_id, mime_type')
    .is('deleted_at', null)
    .eq('status', 'ready')

  if (q) {
    query = query.or(`name.ilike.%${q}%,original_filename.ilike.%${q}%`)
  }
  if (branchId) {
    query = query.eq('branch_id', branchId)
  }
  if (sectionId) {
    query = query.eq('section_id', sectionId)
  }
  if (uploadedBy) {
    query = query.eq('uploaded_by', uploadedBy)
  }
  if (dateFrom) {
    query = query.gte('document_date', dateFrom)
  }
  if (dateTo) {
    query = query.lte('document_date', dateTo)
  }

  const { data: documentsData } = await query.order('document_date', { ascending: false }).limit(50)
  const documents = documentsData ?? []

  // Get uploader names
  const uploaderIds = [...new Set(documents.map((d) => d.uploaded_by).filter(Boolean) as string[])]
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

  // Get branch/section names
  const branchIds = [...new Set(documents.map((d) => d.branch_id))]
  const sectionIds = [...new Set(documents.map((d) => d.section_id))]
  const branches = new Map<string, { name: string; slug: string }>()
  const sections = new Map<string, { name: string; slug: string; branch_id: string }>()

  if (branchIds.length > 0) {
    const { data: branchRows } = await supabase
      .from('branches')
      .select('id, name, slug')
      .in('id', branchIds)
    for (const row of branchRows ?? []) {
      branches.set(row.id, { name: row.name, slug: row.slug })
    }
  }
  if (sectionIds.length > 0) {
    const { data: sectionRows } = await supabase
      .from('sections')
      .select('id, name, slug, branch_id')
      .in('id', sectionIds)
    for (const row of sectionRows ?? []) {
      sections.set(row.id, { name: row.name, slug: row.slug, branch_id: row.branch_id })
    }
  }

  const results = documents.map((doc) => {
    const branch = branches.get(doc.branch_id)
    const section = sections.get(doc.section_id)
    const uploaderName = doc.uploaded_by ? uploaders.get(doc.uploaded_by) ?? '—' : '—'

    let sectionPath = ''
    if (branch && section) {
      sectionPath = `/dashboard/branches/${branch.slug}/${section.slug}`
    }

    return {
      id: doc.id,
      name: doc.name,
      original_filename: doc.original_filename,
      document_date: doc.document_date,
      uploaded_at: doc.uploaded_at,
      size_bytes: doc.size_bytes,
      mime_type: doc.mime_type,
      uploader_name: uploaderName,
      branch_name: branch?.name ?? '—',
      section_name: section?.name ?? '—',
      section_path: sectionPath,
    }
  })

  return NextResponse.json({ results, count: results.length })
}
