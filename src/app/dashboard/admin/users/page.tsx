import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { DeleteUserButton } from './DeleteUserButton'
import type { Profile } from '@/lib/types'

export default async function UsersPage() {
  const { data } = await supabaseAdmin()
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const profiles = (data ?? []) as Profile[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage people who can access documents
          </p>
        </div>
        <Link
          href="/dashboard/admin/users/new"
          className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
        >
          Add User
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Full Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {profiles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                  No users yet.
                </td>
              </tr>
            )}
            {profiles.map((profile) => (
              <tr key={profile.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                  {profile.full_name ?? '—'}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{profile.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      profile.role === 'super_admin'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {profile.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(profile.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-right space-x-4 whitespace-nowrap">
                  <Link
                    href={`/dashboard/admin/users/${profile.id}/edit`}
                    className="text-amber-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <DeleteUserButton userId={profile.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
