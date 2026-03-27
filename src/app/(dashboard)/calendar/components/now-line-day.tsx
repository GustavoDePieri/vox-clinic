"use client"

import { useEffect, useRef } from "react"

const ROW_HEIGHT = 64

export function NowLineDay() {
  const lineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function update() {
      if (!lineRef.current) return
      const now = new Date()
      const h = now.getHours()
      const m = now.getMinutes()
      if (h < 7 || h > 20) {
        lineRef.current.style.display = "none"
        return
      }
      const top = (h - 7) * ROW_HEIGHT + (m / 60) * ROW_HEIGHT
      lineRef.current.style.display = ""
      lineRef.current.style.top = `${top}px`
    }

    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      ref={lineRef}
      className="absolute left-16 right-0 z-10 pointer-events-none"
    >
      <div className="h-[2px] bg-vox-error/80 relative">
        <div className="absolute -left-1.5 -top-[4px] size-[10px] rounded-full bg-vox-error/80" />
      </div>
    </div>
  )
}
