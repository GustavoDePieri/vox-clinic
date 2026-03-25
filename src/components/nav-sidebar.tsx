"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Mic, CalendarDays, Settings } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Pacientes", icon: Users },
  { href: "/calendar", label: "Agenda", icon: CalendarDays },
  { href: "/appointments/new", label: "Nova Consulta", icon: Mic },
  { href: "/settings", label: "Configurações", icon: Settings },
]

export function NavSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-border/50 py-6">
      <nav className="flex flex-col gap-0.5 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-vox-primary/10 text-vox-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <item.icon className={`size-[18px] ${isActive ? "text-vox-primary" : ""}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
