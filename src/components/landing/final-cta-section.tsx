"use client"

import Link from "next/link"
import { BlurFade } from "@/components/ui/blur-fade"
import { ArrowRight } from "lucide-react"

const footerLinks = {
  Produto: [
    { label: "Funcionalidades", href: "/#features" },
    { label: "Preços", href: "/#pricing" },
    { label: "Documentação", href: "/docs" },
    { label: "Changelog", href: "/changelog" },
  ],
  Recursos: [
    { label: "Central de Ajuda", href: "/ajuda" },
    { label: "Status", href: "/status" },
  ],
  Empresa: [
    { label: "Sobre", href: "/sobre" },
    { label: "Contato", href: "/contato" },
  ],
  Legal: [
    { label: "Privacidade", href: "/privacidade" },
    { label: "Termos", href: "/termos" },
    { label: "DPO", href: "/dpo" },
    { label: "LGPD", href: "/lgpd" },
  ],
}

export function FinalCTASection() {
  return (
    <section className="relative">
      {/* CTA */}
      <div className="border-t border-white/[0.06] py-24 md:py-32">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <BlurFade inView delay={0.05}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
              Pronto para modernizar sua clínica?
            </h2>
          </BlurFade>

          <BlurFade inView delay={0.1}>
            <p className="text-[15px] text-zinc-500 mb-8">
              14 dias grátis. Sem cartão de crédito. Cancele quando quiser.
            </p>
          </BlurFade>

          <BlurFade inView delay={0.15}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center h-11 px-6 text-[14px] font-medium rounded-lg bg-white text-zinc-900 hover:bg-zinc-200 transition-colors gap-2"
              >
                Começar grátis
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/contato"
                className="inline-flex items-center justify-center h-11 px-6 text-[14px] text-zinc-400 rounded-lg border border-white/[0.1] hover:bg-white/[0.04] transition-colors"
              >
                Agendar demonstração
              </Link>
            </div>
          </BlurFade>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-[12px] font-medium text-zinc-500 uppercase tracking-wider mb-3">
                  {category}
                </h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[13px] text-zinc-600 hover:text-zinc-300 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-zinc-700">&copy; 2026 VoxClinic. Todos os direitos reservados.</p>
            <div className="flex gap-4 text-[12px] text-zinc-700">
              <a href="https://twitter.com/voxclinic" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">
                Twitter
              </a>
              <a href="https://linkedin.com/company/voxclinic" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">
                LinkedIn
              </a>
              <a href="https://instagram.com/voxclinic" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">
                Instagram
              </a>
            </div>
          </div>
        </div>
      </footer>
    </section>
  )
}
