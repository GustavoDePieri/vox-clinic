import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("@/components/ui/blur-fade", () => ({
  BlurFade: ({ children }: any) => <div>{children}</div>,
}))

import { PricingSection } from "../landing/pricing-section"

describe("PricingSection", () => {
  it("renders 3 pricing tiers", () => {
    render(<PricingSection />)
    expect(screen.getByText("Grátis")).toBeInTheDocument()
    expect(screen.getByText("Profissional")).toBeInTheDocument()
    expect(screen.getByText("Clínica")).toBeInTheDocument()
  })

  it("Profissional has Mais popular badge", () => {
    render(<PricingSection />)
    expect(screen.getByText("Mais popular")).toBeInTheDocument()
  })

  it("each tier has a CTA button", () => {
    render(<PricingSection />)
    expect(screen.getByText("Começar grátis")).toBeInTheDocument()
    expect(screen.getByText("Começar teste grátis")).toBeInTheDocument()
    expect(screen.getByText("Falar com vendas")).toBeInTheDocument()
  })

  it("Grátis features render correctly", () => {
    render(<PricingSection />)
    expect(screen.getByText("Até 30 pacientes")).toBeInTheDocument()
    expect(screen.getByText("1 agenda")).toBeInTheDocument()
    expect(screen.getByText("Gravação e transcrição IA")).toBeInTheDocument()
    expect(screen.getByText("Prontuário completo")).toBeInTheDocument()
    expect(screen.getByText("1 usuário")).toBeInTheDocument()
  })

  it("Profissional features render correctly", () => {
    render(<PricingSection />)
    expect(screen.getByText("Pacientes ilimitados")).toBeInTheDocument()
    expect(screen.getByText("WhatsApp Business")).toBeInTheDocument()
    expect(screen.getByText("NFS-e e TISS")).toBeInTheDocument()
    expect(screen.getByText("Financeiro completo")).toBeInTheDocument()
  })

  it("Clínica features render correctly", () => {
    render(<PricingSection />)
    expect(screen.getByText("Tudo do Profissional +")).toBeInTheDocument()
    expect(screen.getByText("Usuários ilimitados")).toBeInTheDocument()
    expect(screen.getByText("Teleconsulta")).toBeInTheDocument()
    expect(screen.getByText("Suporte prioritário")).toBeInTheDocument()
  })
})
