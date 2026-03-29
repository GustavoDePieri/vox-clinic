export interface ErrorEntry {
  timestamp: number
  level: "error" | "warn"
  message: string
  stack?: string
}

const MAX_BUFFER = 500
const buffer: ErrorEntry[] = []

export function captureError(entry: ErrorEntry) {
  buffer.push(entry)
  if (buffer.length > MAX_BUFFER) buffer.shift()
}

export function getErrors(sinceMs?: number): ErrorEntry[] {
  const cutoff = sinceMs ?? Date.now() - 12 * 60 * 60 * 1000
  return buffer.filter((e) => e.timestamp >= cutoff)
}

export function installConsoleCapture() {
  const origError = console.error
  const origWarn = console.warn

  console.error = (...args: unknown[]) => {
    origError.apply(console, args)
    const message = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ")
    captureError({
      timestamp: Date.now(),
      level: "error",
      message: message.slice(0, 2000),
      stack: args.find((a): a is Error => a instanceof Error)?.stack?.slice(0, 1000),
    })
  }

  console.warn = (...args: unknown[]) => {
    origWarn.apply(console, args)
    const message = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ")
    if (message.includes("[") || message.includes("Error") || message.includes("MISSING")) {
      captureError({ timestamp: Date.now(), level: "warn", message: message.slice(0, 2000) })
    }
  }
}
