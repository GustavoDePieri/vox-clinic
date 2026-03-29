"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

const navLinks = [
  { href: "#features", label: "Produto" },
  { href: "#pricing", label: "Preços" },
  { href: "#seguranca", label: "Segurança" },
  { href: "/docs", label: "Docs", external: true },
]

interface NavBarProps {
  isAuthenticated?: boolean
  dashboardUrl?: string
}

export function NavBar({ isAuthenticated = false, dashboardUrl = "/dashboard" }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault()
      const el = document.querySelector(href)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      setMobileOpen(false)
    }
  }, [])

  return (
    <nav data-testid="nav-bar" className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-6 flex h-14 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-vox-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            VoxClinic
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) =>
            link.external ? (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-[13px] text-zinc-400 hover:text-white transition-colors rounded-md"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleSmoothScroll(e, link.href)}
                className="px-3 py-1.5 text-[13px] text-zinc-400 hover:text-white transition-colors rounded-md"
              >
                {link.label}
              </a>
            )
          )}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              href={dashboardUrl}
              className="inline-flex h-8 items-center justify-center rounded-lg bg-vox-primary px-4 text-[13px] font-medium text-white hover:bg-vox-primary/90 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="inline-flex h-8 items-center justify-center rounded-lg px-4 text-[13px] text-zinc-400 hover:text-white transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex h-8 items-center justify-center rounded-lg bg-white px-4 text-[13px] font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
              >
                Começar grátis
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden inline-flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.05] transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden overflow-hidden border-t border-white/[0.06] bg-[#09090b]/95 backdrop-blur-xl"
          >
            <div className="px-6 py-4 space-y-1">
              {navLinks.map((link) =>
                link.external ? (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-[13px] text-zinc-400 hover:text-white transition-colors py-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block text-[13px] text-zinc-400 hover:text-white transition-colors py-2"
                    onClick={(e) => handleSmoothScroll(e, link.href)}
                  >
                    {link.label}
                  </a>
                )
              )}
              <div className="pt-3 mt-2 border-t border-white/[0.06] flex flex-col gap-2">
                {isAuthenticated ? (
                  <Link
                    href={dashboardUrl}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-vox-primary px-4 text-[13px] font-medium text-white"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/sign-in"
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-white/10 text-[13px] text-zinc-400"
                    >
                      Entrar
                    </Link>
                    <Link
                      href="/sign-up"
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-white text-[13px] font-medium text-zinc-900"
                    >
                      Começar grátis
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
