import { getAdminUsers } from "@/server/actions/admin"

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("pt-BR")
}

export default async function AdminUsersPage() {
  const users = await getAdminUsers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
        <p className="text-sm text-slate-500 mt-1">
          Todos os usuarios da plataforma
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Nome</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Profissao</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Clinica</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Plano</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Pacientes</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Onboarding</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                <td className="px-4 py-3 text-slate-600">{user.email}</td>
                <td className="px-4 py-3">
                  {user.role === "superadmin" ? (
                    <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-700">
                      ADMIN
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      user
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 capitalize">{user.workspace?.professionType ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{user.clinicName ?? "-"}</td>
                <td className="px-4 py-3">
                  {user.workspace ? (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                      user.workspace.plan === "enterprise" ? "bg-purple-50 text-purple-700 border-purple-200" :
                      user.workspace.plan === "pro" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-slate-50 text-slate-600 border-slate-200"
                    }`}>
                      {user.workspace.plan}
                    </span>
                  ) : "-"}
                </td>
                <td className="px-4 py-3 text-slate-600 tabular-nums">
                  {user.workspace?._count.patients ?? "-"}
                </td>
                <td className="px-4 py-3">
                  {user.onboardingComplete ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      Completo
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      Pendente
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 tabular-nums">{formatDate(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 text-center">
        {users.length} usuario{users.length !== 1 ? "s" : ""} na plataforma
      </p>
    </div>
  )
}
