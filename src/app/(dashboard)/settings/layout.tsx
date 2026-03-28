import { redirect } from "next/navigation"
import { resolveWorkspaceRole } from "@/lib/auth-context"
import { hasPermission } from "@/lib/permissions"

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await resolveWorkspaceRole()

  if (!ctx || !hasPermission(ctx.role, "settings.view")) {
    redirect("/dashboard")
  }

  return <>{children}</>
}
