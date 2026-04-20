import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { DeleteBranchButton } from './DeleteBranchButton'
import type { Branch } from '@/lib/types'

type BranchWithCount = Branch & {
  sections: { count: number }[]
}

export default async function BranchesPage() {
  const { data } = await supabaseAdmin()
    .from('branches')
    .select('id, name, slug, created_at, drive_folder_id, sections(count)')
    .order('name')

  const branches = (data ?? []) as BranchWithCount[]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Branches</h1>
          <p className="mt-1 text-sm text-slate-500">
            Each branch has its own document sections
          </p>
        </div>
        <Link
          href="/dashboard/admin/branches/new"
          className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
        >
          New Branch
        </Link>
      </div>

      {branches.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sections</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {branches.map((branch) => (
                <tr key={branch.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{branch.name}</td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-500">{branch.slug}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {branch.sections?.[0]?.count ?? 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(branch.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-right space-x-4 whitespace-nowrap">
                    <Link
                      href={`/dashboard/admin/branches/${branch.id}/edit`}
                      className="text-amber-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <DeleteBranchButton id={branch.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-500">
            No branches yet. Create your first branch to get started.
          </p>
        </div>
      )}
    </div>
  )
}
