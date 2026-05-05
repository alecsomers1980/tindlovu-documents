import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/lib/types'

export async function requireAuth(): Promise<{ profile: Profile }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/login')
  return { profile }
}

export async function requireSuperAdmin(): Promise<{ profile: Profile }> {
  const { profile } = await requireAuth()
  if (profile.role !== 'super_admin') {
    redirect('/dashboard')
  }
  return { profile }
}
