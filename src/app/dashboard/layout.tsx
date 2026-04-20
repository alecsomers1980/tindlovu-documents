import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  FolderOpen,
  Trash2,
  Users,
  Building2,
  ShieldCheck,
  LogOut,
} from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const { data: branches } = await supabase
    .from('branches')
    .select('id, name, slug')
    .order('name')

  const isSuperAdmin = profile?.role === 'super_admin'

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-[#231F20] text-white flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-white/10">
          <Image
            src="/Logo_white.png"
            alt="Tindlovu"
            width={144}
            height={36}
            priority
          />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <FolderOpen className="w-4 h-4 shrink-0" />
            Dashboard
          </Link>

          <div className="pt-4 pb-1 px-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Branches
            </span>
          </div>

          {branches && branches.length > 0 ? (
            branches.map((branch) => (
              <Link
                key={branch.id}
                href={`/dashboard/branches/${branch.slug}`}
                className="flex items-center gap-3 px-3 py-2 pl-6 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Building2 className="w-4 h-4 shrink-0" />
                {branch.name}
              </Link>
            ))
          ) : (
            <p className="px-6 py-2 text-xs text-slate-500">No branches</p>
          )}

          {isSuperAdmin && (
            <>
              <Link
                href="/dashboard/recycle-bin"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                Recycle Bin
              </Link>
              <div className="pt-4 pb-1 px-3">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <Link
                href="/dashboard/admin/users"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Users className="w-4 h-4 shrink-0" />
                Users
              </Link>
              <Link
                href="/dashboard/admin/branches"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Building2 className="w-4 h-4 shrink-0" />
                Branches Mgmt
              </Link>
              <Link
                href="/dashboard/admin/permissions"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Permissions
              </Link>
            </>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-xs text-slate-400 truncate mb-3">{user.email}</p>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-full px-2 py-1 rounded-lg hover:bg-white/5"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 bg-slate-50 min-h-screen">{children}</main>
    </div>
  )
}
