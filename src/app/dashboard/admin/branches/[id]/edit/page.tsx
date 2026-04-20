import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { EditBranchForm } from './EditBranchForm'
import { SectionsList } from './SectionsList'
import type { Branch, Section } from '@/lib/types'

export default async function EditBranchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: branch } = await supabaseAdmin()
    .from('branches')
    .select('*')
    .eq('id', id)
    .single<Branch>()

  if (!branch) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">Branch not found</p>
        <Link
          href="/dashboard/admin/branches"
          className="mt-3 inline-block text-sm text-amber-600 hover:underline"
        >
          ← Back to Branches
        </Link>
      </div>
    )
  }

  const { data: sectionsData } = await supabaseAdmin()
    .from('sections')
    .select('*')
    .eq('branch_id', id)
    .order('name')

  const sections = (sectionsData ?? []) as Section[]

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/admin/branches"
          className="text-sm text-amber-600 hover:underline"
        >
          ← Branches
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-8">
        Edit Branch — {branch.name}
      </h1>
      <div className="space-y-8">
        <EditBranchForm branch={branch} />
        <SectionsList branchId={id} sections={sections} />
      </div>
    </div>
  )
}
