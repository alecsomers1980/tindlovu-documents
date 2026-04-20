'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getDriveClient } from '@/lib/drive/client'
import { ensureSectionFolder } from '@/lib/drive/folders'
import { revalidatePath } from 'next/cache'
import { Readable } from 'node:stream'

async function canUploadTo(userId: string, sectionId: string, branchId: string): Promise<boolean> {
  const admin = supabaseAdmin()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  if (profile?.role === 'super_admin') return true

  const { data: perm } = await admin
    .from('permissions')
    .select('id')
    .eq('user_id', userId)
    .eq('branch_id', branchId)
    .eq('section_id', sectionId)
    .eq('can_upload', true)
    .maybeSingle()
  return !!perm
}

async function canAccess(userId: string, sectionId: string, branchId: string): Promise<boolean> {
  const admin = supabaseAdmin()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  if (profile?.role === 'super_admin') return true

  const { data: perm } = await admin
    .from('permissions')
    .select('id')
    .eq('user_id', userId)
    .eq('branch_id', branchId)
    .eq('section_id', sectionId)
    .maybeSingle()
  return !!perm
}

export async function uploadDocument(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const sectionId = formData.get('sectionId') as string
  const path = formData.get('path') as string
  const rawName = formData.get('name') as string
  const name = rawName?.trim() ?? ''
  const documentDate = formData.get('document_date') as string
  const rawFile = formData.get('file')

  if (!sectionId) return { ok: false, error: 'Missing section' }
  if (!name || name.length > 200) return { ok: false, error: 'Invalid document name' }
  if (!documentDate || !/^\d{4}-\d{2}-\d{2}$/.test(documentDate))
    return { ok: false, error: 'Invalid document date' }
  if (!rawFile || !(rawFile instanceof File) || rawFile.size === 0)
    return { ok: false, error: 'File is required' }
  const file = rawFile
  if (file.size >= 100 * 1024 * 1024) return { ok: false, error: 'File too large' }

  const admin = supabaseAdmin()
  const { data: section } = await admin
    .from('sections')
    .select('id, branch_id')
    .eq('id', sectionId)
    .single()
  if (!section) return { ok: false, error: 'Section not found' }

  if (!(await canUploadTo(user.id, section.id, section.branch_id)))
    return { ok: false, error: 'No upload permission' }

  const sectionFolderId = await ensureSectionFolder(section.id)

  const { data: doc, error: insertError } = await admin
    .from('documents')
    .insert({
      branch_id: section.branch_id,
      section_id: section.id,
      name,
      original_filename: file.name,
      document_date: documentDate,
      uploaded_by: user.id,
      size_bytes: file.size,
      mime_type: file.type || null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError || !doc) return { ok: false, error: 'Failed to create document record' }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const stream = Readable.from(buffer)
    const drive = getDriveClient()
    const res = await drive.files.create({
      requestBody: { name: file.name, parents: [sectionFolderId] },
      media: { mimeType: file.type || 'application/octet-stream', body: stream },
      fields: 'id',
    })

    await admin
      .from('documents')
      .update({ drive_file_id: res.data.id, status: 'ready' })
      .eq('id', doc.id)
    if (path) revalidatePath(path)
    return { ok: true }
  } catch (err) {
    await admin.from('documents').update({ status: 'failed' }).eq('id', doc.id)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: `Upload failed: ${message}` }
  }
}

export async function softDeleteDocument(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const documentId = formData.get('documentId') as string
  const path = formData.get('path') as string

  const admin = supabaseAdmin()
  const { data: doc } = await admin
    .from('documents')
    .select('id, branch_id, section_id, drive_file_id')
    .eq('id', documentId)
    .single()
  if (!doc) throw new Error('Document not found')

  if (!(await canAccess(user.id, doc.section_id, doc.branch_id)))
    throw new Error('Not allowed')

  await admin
    .from('documents')
    .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
    .eq('id', documentId)

  if (doc.drive_file_id) {
    try {
      const drive = getDriveClient()
      await drive.files.update({
        fileId: doc.drive_file_id,
        requestBody: { trashed: true },
      })
    } catch (err) {
      console.error('Failed to trash Drive file:', err)
    }
  }

  if (path) revalidatePath(path)
}

export async function restoreDocument(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = supabaseAdmin()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'super_admin') throw new Error('Not allowed')

  const documentId = formData.get('documentId') as string
  const { data: doc } = await admin
    .from('documents')
    .select('drive_file_id')
    .eq('id', documentId)
    .single()

  if (doc?.drive_file_id) {
    try {
      const drive = getDriveClient()
      await drive.files.update({
        fileId: doc.drive_file_id,
        requestBody: { trashed: false },
      })
    } catch (err) {
      console.error('Failed to untrash Drive file:', err)
    }
  }

  await admin.from('documents').update({ deleted_at: null, deleted_by: null }).eq('id', documentId)
  revalidatePath('/dashboard/recycle-bin')
}

export async function permanentDeleteDocument(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = supabaseAdmin()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'super_admin') throw new Error('Not allowed')

  const documentId = formData.get('documentId') as string
  const { data: doc } = await admin
    .from('documents')
    .select('drive_file_id')
    .eq('id', documentId)
    .single()

  if (doc?.drive_file_id) {
    try {
      const drive = getDriveClient()
      await drive.files.delete({ fileId: doc.drive_file_id })
    } catch (err) {
      console.error('Failed to delete Drive file:', err)
    }
  }

  await admin.from('documents').delete().eq('id', documentId)
  revalidatePath('/dashboard/recycle-bin')
}
