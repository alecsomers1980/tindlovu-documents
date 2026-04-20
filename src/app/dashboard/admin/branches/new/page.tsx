import Link from 'next/link'
import { NewBranchForm } from './NewBranchForm'

export default function NewBranchPage() {
  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link
          href="/dashboard/admin/branches"
          className="text-sm text-amber-600 hover:underline"
        >
          ← Back to Branches
        </Link>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-xl font-semibold text-slate-900 mb-6">New Branch</h1>
        <NewBranchForm />
      </div>
    </div>
  )
}
