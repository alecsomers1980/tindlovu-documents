import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Branch, Section } from '@/lib/types'

export default async function BranchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: branch } = await supabase
    .from('branches')
    .select('*')
    .eq('slug', slug)
    .single<Branch>()

  if (!branch) {
    notFound()
  }

  let sections: Section[] = []

  const { data } = await supabase
    .from('sections')
    .select('*')
    .eq('branch_id', branch.id)
    .is('parent_id', null)
    .order('name')
  sections = data ?? []

  return (
    <div className="space-y-6 p-8">
      <Link href="/dashboard" className="text-sm text-amber-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="text-3xl font-bold text-slate-900">{branch.name}</h1>

      {sections.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <p className="text-slate-600">You do not have access to any sections in this branch yet. Contact your super admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => (
            <Link
              key={section.id}
              href={`/dashboard/branches/${branch.slug}/${section.slug}`}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-slate-900">{section.name}</h2>
              <p className="mt-1 text-sm text-slate-500">Browse documents</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
