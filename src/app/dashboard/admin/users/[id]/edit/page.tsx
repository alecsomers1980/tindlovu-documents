import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import EditUserForm from './EditUserForm'
import PermissionsMatrix from './PermissionsMatrix'

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = supabaseAdmin()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">User not found</p>
          <Link
            href="/dashboard/admin/users"
            className="mt-4 inline-block text-sm text-amber-600 hover:underline"
          >
            ← Back to Users
          </Link>
        </div>
      </div>
    )
  }

  const { data: branches } = await supabase
    .from('branches')
    .select('*')
    .order('name')

  const { data: sections } = await supabase
    .from('sections')
    .select('*')
    .order('branch_id')
    .order('name')

  const { data: permissions } = await supabase
    .from('permissions')
    .select('*')
    .eq('user_id', id)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/dashboard/admin/users"
          className="text-sm text-amber-600 hover:underline"
        >
          ← Users
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Edit User — {profile.full_name ?? profile.email}
        </h1>
      </div>
      <div className="space-y-6">
        <EditUserForm profile={profile} />
        <PermissionsMatrix
          userId={profile.id}
          branches={branches ?? []}
          sections={sections ?? []}
          permissions={permissions ?? []}
        />
      </div>
    </div>
  )
}
