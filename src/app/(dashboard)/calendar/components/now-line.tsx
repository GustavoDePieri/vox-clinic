"use client"

import { useEffect, useRef, memo } from "react"
import { isToday } from "../helpers"

const ROW_HEIGHT = 72

function NowLineInner({ weekDays }: { weekDays: Date[] }) {
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

  const todayIndex = weekDays.findIndex((d) => isToday(d))
  if (todayIndex === -1) return null

  return (
    <div
      ref={lineRef}
      className="absolute left-[56px] right-0 z-10 pointer-events-none"
    >
      <div
        className="absolute h-[2px] bg-vox-error/80"
        style={{
          left: `calc(${(todayIndex / 7) * 100}%)`,
          width: `calc(${(1 / 7) * 100}%)`,
        }}
      >
        <div className="absolute -left-1.5 -top-[4px] size-[10px] rounded-full bg-vox-error/80" />
      </div>
    </div>
  )
}

export const NowLine = memo(NowLineInner)
