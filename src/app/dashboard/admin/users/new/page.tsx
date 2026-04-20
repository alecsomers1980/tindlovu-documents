import NewUserForm from './NewUserForm'

export default function NewUserPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Create User</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <NewUserForm />
      </div>
    </div>
  )
}
