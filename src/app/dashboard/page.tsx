import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'

export default async function DashboardPage() {
  const { profile } = await requireAuth()
  const supabase = await createClient()

  const { data: branches } = await supabase
    .from('branches')
    .select('id, name, slug')
    .order('name')

  const isSuperAdmin = profile.role === 'super_admin'
  const displayName = profile.full_name || profile.email

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-8">
        Welcome, {displayName}
      </h1>

      {branches && branches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <Link
              key={branch.id}
              href={`/dashboard/branches/${branch.slug}`}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow block"
            >
              <h2 className="text-lg font-medium text-slate-900">{branch.name}</h2>
              <p className="text-sm text-slate-400 mt-1">View documents</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-500">
            No branches yet. Ask your super admin to create one.
          </p>
          {isSuperAdmin && (
            <p className="text-sm mt-3">
              <Link
                href="/dashboard/admin/branches"
                className="text-amber-600 hover:underline font-medium"
              >
                Create a branch
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
