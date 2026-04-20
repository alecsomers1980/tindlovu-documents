'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'

type State = { ok: boolean; error: string | null }

export async function bootstrapSuperAdmin(
  _prevState: State,
  formData: FormData,
): Promise<State> {
  try {
    const admin = supabaseAdmin()

    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('role', 'super_admin')
      .limit(1)

    if (existing && existing.length > 0) {
      return { ok: false, error: 'A super admin already exists.' }
    }

    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const full_name = String(formData.get('full_name') ?? '').trim()

    if (!email || !password || !full_name) {
      return { ok: false, error: 'All fields are required.' }
    }
    if (password.length < 8) {
      return { ok: false, error: 'Password must be at least 8 characters.' }
    }

    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (userError) return { ok: false, error: userError.message }
    if (!userData?.user?.id) return { ok: false, error: 'Failed to create user.' }

    const { error: profileError } = await admin
      .from('profiles')
      .update({ role: 'super_admin', full_name })
      .eq('id', userData.user.id)

    if (profileError) return { ok: false, error: profileError.message }

    return { ok: true, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return { ok: false, error: message }
  }
}
