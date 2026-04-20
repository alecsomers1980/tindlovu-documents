'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export type State = {
  ok: boolean
  error: string | null
  newUserId?: string
}

export async function createUser(_prev: State, formData: FormData): Promise<State> {
  await requireSuperAdmin()

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const full_name = String(formData.get('full_name') ?? '').trim()
  const role = String(formData.get('role') ?? 'user')

  if (!email || !password || !full_name) {
    return { ok: false, error: 'All fields are required.' }
  }

  const admin = supabaseAdmin()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (error) return { ok: false, error: error.message }
  if (!data.user) return { ok: false, error: 'Failed to create user.' }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ full_name, role })
    .eq('id', data.user.id)

  if (profileError) return { ok: false, error: profileError.message }

  revalidatePath('/dashboard/admin/users')
  return { ok: true, error: null, newUserId: data.user.id }
}

export async function updateUser(_prev: State, formData: FormData): Promise<State> {
  await requireSuperAdmin()

  const user_id = String(formData.get('user_id') ?? '')
  const full_name = String(formData.get('full_name') ?? '').trim()
  const role = String(formData.get('role') ?? 'user')

  const { error } = await supabaseAdmin()
    .from('profiles')
    .update({ full_name, role })
    .eq('id', user_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard/admin/users')
  return { ok: true, error: null }
}

export async function deleteUser(formData: FormData): Promise<void> {
  await requireSuperAdmin()
  const user_id = String(formData.get('user_id') ?? '')
  await supabaseAdmin().auth.admin.deleteUser(user_id)
  revalidatePath('/dashboard/admin/users')
}

export async function grantPermission(formData: FormData): Promise<void> {
  await requireSuperAdmin()
  const user_id = String(formData.get('user_id') ?? '')
  const branch_id = String(formData.get('branch_id') ?? '')
  const section_id = String(formData.get('section_id') ?? '')
  const can_upload_value = formData.get('can_upload')
  const can_upload = can_upload_value === 'true' || can_upload_value === 'on'

  await supabaseAdmin()
    .from('permissions')
    .insert({ user_id, branch_id, section_id, can_upload })

  revalidatePath('/dashboard/admin/users')
}

export async function revokePermission(formData: FormData): Promise<void> {
  await requireSuperAdmin()
  const permission_id = String(formData.get('permission_id') ?? '')
  await supabaseAdmin().from('permissions').delete().eq('id', permission_id)
  revalidatePath('/dashboard/admin/users')
}

export async function updatePermissionCanUpload(formData: FormData): Promise<void> {
  await requireSuperAdmin()
  const permission_id = String(formData.get('permission_id') ?? '')
  const can_upload_value = formData.get('can_upload')
  const can_upload = can_upload_value === 'true' || can_upload_value === 'on'

  await supabaseAdmin()
    .from('permissions')
    .update({ can_upload })
    .eq('id', permission_id)

  revalidatePath('/dashboard/admin/users')
}
