'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { slugify } from '@/lib/slug'

export type State = { ok: boolean; error: string | null; newId?: string }

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Unexpected error'
}

export async function createBranch(_prev: State, fd: FormData): Promise<State> {
  try {
    await requireSuperAdmin()
    const name = String(fd.get('name') ?? '').trim()
    if (!name) return { ok: false, error: 'Name is required.' }
    const slug = String(fd.get('slug') ?? '').trim() || slugify(name)

    const { data, error } = await supabaseAdmin()
      .from('branches')
      .insert({ name, slug })
      .select('id')
      .single()

    if (error) return { ok: false, error: error.message }
    revalidatePath('/dashboard/admin/branches')
    return { ok: true, error: null, newId: data.id }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}

export async function updateBranch(_prev: State, fd: FormData): Promise<State> {
  try {
    await requireSuperAdmin()
    const id = String(fd.get('id') ?? '')
    const name = String(fd.get('name') ?? '').trim()
    const slug = String(fd.get('slug') ?? '').trim() || slugify(name)

    if (!id) return { ok: false, error: 'ID is required.' }
    if (!name) return { ok: false, error: 'Name is required.' }

    const { error } = await supabaseAdmin()
      .from('branches')
      .update({ name, slug })
      .eq('id', id)

    if (error) return { ok: false, error: error.message }
    revalidatePath('/dashboard/admin/branches')
    revalidatePath(`/dashboard/admin/branches/${id}/edit`)
    return { ok: true, error: null }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}

export async function deleteBranch(fd: FormData): Promise<void> {
  await requireSuperAdmin()
  const id = String(fd.get('id') ?? '')
  if (!id) return
  await supabaseAdmin().from('branches').delete().eq('id', id)
  revalidatePath('/dashboard/admin/branches')
}

export async function createSection(_prev: State, fd: FormData): Promise<State> {
  try {
    await requireSuperAdmin()
    const branch_id = String(fd.get('branch_id') ?? '')
    const parent_id_raw = String(fd.get('parent_id') ?? '').trim()
    const parent_id = parent_id_raw || null
    const name = String(fd.get('name') ?? '').trim()
    if (!branch_id) return { ok: false, error: 'Branch ID is required.' }
    if (!name) return { ok: false, error: 'Name is required.' }
    const slug = String(fd.get('slug') ?? '').trim() || slugify(name)

    const { data, error } = await supabaseAdmin()
      .from('sections')
      .insert({ branch_id, parent_id, name, slug })
      .select('id')
      .single()

    if (error) return { ok: false, error: error.message }
    revalidatePath(`/dashboard/admin/branches/${branch_id}/edit`)
    revalidatePath(`/dashboard/branches`, 'layout')
    return { ok: true, error: null, newId: data.id }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}

export async function updateSection(_prev: State, fd: FormData): Promise<State> {
  try {
    await requireSuperAdmin()
    const id = String(fd.get('id') ?? '')
    const name = String(fd.get('name') ?? '').trim()
    const slug = String(fd.get('slug') ?? '').trim() || slugify(name)
    const path = String(fd.get('path') ?? '').trim()

    if (!id) return { ok: false, error: 'Section ID is required.' }
    if (!name) return { ok: false, error: 'Name is required.' }

    const admin = supabaseAdmin()
    const { data: section } = await admin
      .from('sections')
      .select('drive_folder_id, branch_id')
      .eq('id', id)
      .single()

    const { error } = await admin
      .from('sections')
      .update({ name, slug })
      .eq('id', id)
    if (error) return { ok: false, error: error.message }

    if (section?.drive_folder_id) {
      try {
        const { getDriveClient } = await import('@/lib/drive/client')
        await getDriveClient().files.update({
          fileId: section.drive_folder_id,
          requestBody: { name },
        })
      } catch (e) {
        console.error('Failed to rename Drive folder:', e)
      }
    }

    if (section?.branch_id) {
      revalidatePath(`/dashboard/admin/branches/${section.branch_id}/edit`)
    }
    if (path) revalidatePath(path)
    revalidatePath(`/dashboard/branches`, 'layout')
    return { ok: true, error: null }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}

export async function deleteSection(fd: FormData): Promise<void> {
  await requireSuperAdmin()
  const id = String(fd.get('id') ?? '')
  if (!id) return

  const { data: section } = await supabaseAdmin()
    .from('sections')
    .select('branch_id')
    .eq('id', id)
    .single()

  await supabaseAdmin().from('sections').delete().eq('id', id)

  if (section?.branch_id) {
    revalidatePath(`/dashboard/admin/branches/${section.branch_id}/edit`)
  }
  revalidatePath('/dashboard/admin/branches')
  revalidatePath(`/dashboard/branches`, 'layout')
}
