import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

import { NavBar } from "../landing/nav-bar"

describe("NavBar", () => {
  it("renders logo with VoxClinic text", () => {
    render(<NavBar />)
    expect(screen.getByText("VoxClinic")).toBeInTheDocument()
  })

  it("shows Entrar and Começar grátis when not authenticated", () => {
    render(<NavBar isAuthenticated={false} />)
    const entrarLinks = screen.getAllByText("Entrar")
    const gratisLinks = screen.getAllByText(/Começar grátis/i)
    expect(entrarLinks.length).toBeGreaterThanOrEqual(1)
    expect(gratisLinks.length).toBeGreaterThanOrEqual(1)
  })

  it("shows Dashboard when authenticated", () => {
    render(<NavBar isAuthenticated={true} />)
    const dashLinks = screen.getAllByText("Dashboard")
    expect(dashLinks.length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText("Entrar")).not.toBeInTheDocument()
  })

  it("renders nav links", () => {
    render(<NavBar />)
    expect(screen.getByText("Produto")).toBeInTheDocument()
  })

  it("nav links have correct href attributes", () => {
    render(<NavBar />)
    const produtoLink = screen.getByText("Produto")
    expect(produtoLink).toHaveAttribute("href", "#features")
  })

  it("mobile hamburger toggles menu visibility", async () => {
    const user = userEvent.setup()
    render(<NavBar />)

    const hamburger = screen.getByLabelText("Abrir menu")
    expect(hamburger).toBeInTheDocument()

    await user.click(hamburger)
    expect(screen.getByLabelText("Fechar menu")).toBeInTheDocument()

    await user.click(screen.getByLabelText("Fechar menu"))
    expect(screen.getByLabelText("Abrir menu")).toBeInTheDocument()
  })

  it("Entrar links point to /sign-in", () => {
    render(<NavBar />)
    const entrarLinks = screen.getAllByText("Entrar")
    entrarLinks.forEach((link) => {
      expect(link.closest("a")).toHaveAttribute("href", "/sign-in")
    })
  })

  it("Começar grátis links point to /sign-up", () => {
    render(<NavBar />)
    const gratisLinks = screen.getAllByText(/Começar grátis/i)
    gratisLinks.forEach((link) => {
      expect(link.closest("a")).toHaveAttribute("href", "/sign-up")
    })
  })

  it("Dashboard link uses custom dashboardUrl prop", () => {
    render(<NavBar isAuthenticated={true} dashboardUrl="/custom-dash" />)
    const dashLinks = screen.getAllByText("Dashboard")
    dashLinks.forEach((link) => {
      expect(link.closest("a")).toHaveAttribute("href", "/custom-dash")
    })
  })
})
