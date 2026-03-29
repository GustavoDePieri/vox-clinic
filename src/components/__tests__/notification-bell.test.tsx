import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mockGetNotifications = vi.fn()
const mockGetUnreadCount = vi.fn()
const mockMarkAsRead = vi.fn()
const mockMarkAllAsRead = vi.fn()

vi.mock("@/server/actions/notification", () => ({
  getNotifications: (...args: any[]) => mockGetNotifications(...args),
  getUnreadCount: (...args: any[]) => mockGetUnreadCount(...args),
  markAsRead: (...args: any[]) => mockMarkAsRead(...args),
  markAllAsRead: (...args: any[]) => mockMarkAllAsRead(...args),
}))

vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children, open }: any) => <div data-open={open}>{children}</div>,
  PopoverTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
}))

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: any) => <div>{children}</div>,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <span>{children}</span>,
  SheetTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

import { NotificationBell } from "../notification-bell"

const sampleNotifications = [
  {
    id: "1",
    type: "appointment_soon",
    title: "Consulta em 30min",
    body: "Joao Silva - 14:00",
    entityType: "appointment",
    entityId: "a1",
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    type: "system",
    title: "Atualizacao do sistema",
    body: null,
    entityType: null,
    entityId: null,
    read: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockGetNotifications.mockResolvedValue([])
  mockGetUnreadCount.mockResolvedValue(0)
  mockMarkAsRead.mockResolvedValue(undefined)
  mockMarkAllAsRead.mockResolvedValue(undefined)
})

describe("NotificationBell", () => {
  it("renders bell icon button", async () => {
    await act(async () => {
      render(<NotificationBell />)
    })
    // Both desktop (Popover) and mobile (Sheet) triggers have aria-label
    const buttons = screen.getAllByLabelText("Notificações")
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it("shows unread count badge when notifications exist", async () => {
    mockGetNotifications.mockResolvedValue(sampleNotifications)
    mockGetUnreadCount.mockResolvedValue(3)

    await act(async () => {
      render(<NotificationBell />)
    })

    // Badge shows in both desktop and mobile triggers
    const badges = screen.getAllByText("3")
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })

  it("does not show badge when unread count is 0", async () => {
    mockGetUnreadCount.mockResolvedValue(0)

    await act(async () => {
      render(<NotificationBell />)
    })

    expect(screen.queryByText("0")).not.toBeInTheDocument()
  })

  it("shows 9+ when unread count exceeds 9", async () => {
    mockGetNotifications.mockResolvedValue(sampleNotifications)
    mockGetUnreadCount.mockResolvedValue(15)

    await act(async () => {
      render(<NotificationBell />)
    })

    const badges = screen.getAllByText("9+")
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })

  it("renders notification list with items", async () => {
    mockGetNotifications.mockResolvedValue(sampleNotifications)
    mockGetUnreadCount.mockResolvedValue(1)

    await act(async () => {
      render(<NotificationBell />)
    })

    // With mocked Popover/Sheet, content is always rendered
    expect(screen.getAllByText("Consulta em 30min").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Atualizacao do sistema").length).toBeGreaterThanOrEqual(1)
  })

  it("shows empty state when no notifications", async () => {
    mockGetNotifications.mockResolvedValue([])
    mockGetUnreadCount.mockResolvedValue(0)

    await act(async () => {
      render(<NotificationBell />)
    })

    const emptyTexts = screen.getAllByText("Nenhuma notificação")
    expect(emptyTexts.length).toBeGreaterThanOrEqual(1)
  })

  it("mark all as read button calls markAllAsRead", async () => {
    const user = userEvent.setup()
    mockGetNotifications.mockResolvedValue(sampleNotifications)
    mockGetUnreadCount.mockResolvedValue(1)

    await act(async () => {
      render(<NotificationBell />)
    })

    const markAllButtons = screen.getAllByText("Marcar tudo como lido")
    await user.click(markAllButtons[0])

    expect(mockMarkAllAsRead).toHaveBeenCalled()
  })

  it("notification body renders when present", async () => {
    mockGetNotifications.mockResolvedValue(sampleNotifications)
    mockGetUnreadCount.mockResolvedValue(1)

    await act(async () => {
      render(<NotificationBell />)
    })

    const bodyTexts = screen.getAllByText("Joao Silva - 14:00")
    expect(bodyTexts.length).toBeGreaterThanOrEqual(1)
  })
})
