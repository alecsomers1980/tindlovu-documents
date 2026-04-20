import { getDriveClient } from './client'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function ensureRootFolder(): Promise<string> {
  const envId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
  if (envId) return envId

  const drive = getDriveClient()
  const res = await drive.files.create({
    requestBody: {
      name: 'Tindlovu Documents',
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  })

  const id = res.data.id
  if (!id) throw new Error('Drive API did not return an id for root folder')

  console.warn(
    `Created root folder "${id}". Add GOOGLE_DRIVE_ROOT_FOLDER_ID=${id} to .env.local to reuse it.`,
  )
  return id
}

export async function ensureBranchFolder(branchId: string): Promise<string> {
  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('branches')
    .select('name, drive_folder_id')
    .eq('id', branchId)
    .single()
  if (error) throw new Error(`Fetch branch ${branchId}: ${error.message}`)
  if (!data) throw new Error(`Branch ${branchId} not found`)
  if (data.drive_folder_id) return data.drive_folder_id

  const parentId = await ensureRootFolder()
  const drive = getDriveClient()
  const res = await drive.files.create({
    requestBody: {
      name: data.name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  })

  const id = res.data.id
  if (!id) throw new Error(`Drive API did not return an id for branch "${data.name}"`)

  const { error: updateError } = await admin
    .from('branches')
    .update({ drive_folder_id: id })
    .eq('id', branchId)
  if (updateError) throw new Error(`Update branch ${branchId}: ${updateError.message}`)
  return id
}

export async function ensureSectionFolder(sectionId: string): Promise<string> {
  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('sections')
    .select('name, branch_id, parent_id, drive_folder_id')
    .eq('id', sectionId)
    .single()
  if (error) throw new Error(`Fetch section ${sectionId}: ${error.message}`)
  if (!data) throw new Error(`Section ${sectionId} not found`)
  if (data.drive_folder_id) return data.drive_folder_id

  const parentFolderId = data.parent_id
    ? await ensureSectionFolder(data.parent_id)
    : await ensureBranchFolder(data.branch_id)

  const drive = getDriveClient()
  const res = await drive.files.create({
    requestBody: {
      name: data.name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id',
  })

  const id = res.data.id
  if (!id) throw new Error(`Drive API did not return an id for section "${data.name}"`)

  const { error: updateError } = await admin
    .from('sections')
    .update({ drive_folder_id: id })
    .eq('id', sectionId)
  if (updateError) throw new Error(`Update section ${sectionId}: ${updateError.message}`)
  return id
}
