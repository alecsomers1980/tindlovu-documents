'use client'

import { useTransition } from 'react'
import type { Branch, Section, Permission } from '@/lib/types'
import {
  grantPermission,
  revokePermission,
  updatePermissionCanUpload,
} from '../../actions'

export default function PermissionsMatrix({
  userId,
  branches,
  sections,
  permissions,
}: {
  userId: string
  branches: Branch[]
  sections: Section[]
  permissions: Permission[]
}) {
  const [isPending, startTransition] = useTransition()

  const permMap = new Map<string, Permission>()
  for (const p of permissions) permMap.set(p.section_id, p)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Section Access</h2>
        <p className="mt-1 text-sm text-slate-500">
          Check Access to grant the user permission to a section. Can upload
          controls whether they can add new documents.
        </p>
      </div>

      <div className="px-6 py-4">
        {branches.length === 0 ? (
          <p className="text-sm text-slate-500">
            No branches exist yet. Create a branch first.
          </p>
        ) : (
          branches.map((branch, branchIdx) => {
            const branchSections = sections.filter(
              (s) => s.branch_id === branch.id,
            )

            return (
              <div key={branch.id} className={branchIdx > 0 ? 'mt-6' : ''}>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  {branch.name}
                </h3>

                {branchSections.length === 0 ? (
                  <p className="text-sm text-slate-400 py-2">
                    No sections in this branch
                  </p>
                ) : (
                  branchSections.map((section, sectionIdx) => {
                    const permission = permMap.get(section.id)
                    const hasAccess = !!permission
                    const canUpload = permission?.can_upload ?? false

                    return (
                      <div
                        key={section.id}
                        className={`flex items-center justify-between py-2 ${
                          sectionIdx > 0 ? 'border-t border-slate-100' : ''
                        }`}
                      >
                        <span className="text-sm text-slate-700">
                          {section.name}
                        </span>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={hasAccess}
                              disabled={isPending}
                              className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                              onChange={() => {
                                const fd = new FormData()
                                if (hasAccess && permission) {
                                  fd.append('permission_id', permission.id)
                                  startTransition(() => {
                                    revokePermission(fd)
                                  })
                                } else {
                                  fd.append('user_id', userId)
                                  fd.append('branch_id', branch.id)
                                  fd.append('section_id', section.id)
                                  fd.append('can_upload', 'true')
                                  startTransition(() => {
                                    grantPermission(fd)
                                  })
                                }
                              }}
                            />
                            <span className="text-xs text-slate-500 ml-1.5">
                              Access
                            </span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={canUpload}
                              disabled={!hasAccess || isPending}
                              className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                              onChange={() => {
                                if (!permission) return
                                const fd = new FormData()
                                fd.append('permission_id', permission.id)
                                fd.append(
                                  'can_upload',
                                  canUpload ? 'false' : 'true',
                                )
                                startTransition(() => {
                                  updatePermissionCanUpload(fd)
                                })
                              }}
                            />
                            <span className="text-xs text-slate-500 ml-1.5">
                              Can upload
                            </span>
                          </label>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
