import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Profile, Permission } from '@/lib/types'

export default async function PermissionsPage() {
  const admin = supabaseAdmin()

  const { data: profilesData } = await admin
    .from('profiles')
    .select('*')
    .eq('role', 'user')
    .order('created_at', { ascending: false })

  const profiles = (profilesData ?? []) as Profile[]

  const { data: permsData } = await admin.from('permissions').select('*')
  const perms = (permsData ?? []) as Permission[]

  const counts = new Map<string, { sections: number; canUpload: number }>()
  for (const p of perms) {
    const entry = counts.get(p.user_id) ?? { sections: 0, canUpload: 0 }
    entry.sections += 1
    if (p.can_upload) entry.canUpload += 1
    counts.set(p.user_id, entry)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Permissions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Section access per user. Click a user to manage their permissions.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Sections
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Can upload
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {profiles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                  No users to manage. Super admins have access to everything automatically.
                </td>
              </tr>
            )}
            {profiles.map((profile) => {
              const c = counts.get(profile.id) ?? { sections: 0, canUpload: 0 }
              return (
                <tr key={profile.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {profile.full_name ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{profile.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{c.sections}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{c.canUpload}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <Link
                      href={`/dashboard/admin/users/${profile.id}/edit`}
                      className="text-amber-600 hover:underline"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
