import Image from 'next/image'
import { supabaseAdmin } from '@/lib/supabase/admin'
import BootstrapForm from './BootstrapForm'

export default async function BootstrapPage() {
  const { data } = await supabaseAdmin()
    .from('profiles')
    .select('id')
    .eq('role', 'super_admin')
    .limit(1)

  const hasSuperAdmin = (data ?? []).length > 0

  if (hasSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <Image
            src="/Logo.webp"
            alt="Tindlovu Documents"
            width={200}
            height={50}
            className="mx-auto mb-4"
          />
          <p className="text-sm text-slate-600 mb-6">
            Setup already complete. A super admin account exists.
          </p>
          <a
            href="/login"
            className="inline-block bg-amber-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-amber-700"
          >
            Go to login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <Image
          src="/Logo.webp"
          alt="Tindlovu Documents"
          width={200}
          height={50}
          className="mx-auto mb-6"
        />
        <p className="text-sm text-slate-500 text-center mb-8">
          Create the super admin account to get started.
        </p>
        <BootstrapForm />
      </div>
    </div>
  )
}
