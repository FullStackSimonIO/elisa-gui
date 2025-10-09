"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface DigitalClockProps {
  /** Optional label shown above the time, for example the city or timezone. */
  label?: string
  /** Additional classes passed to the root element. */
  className?: string
  /** Update interval in milliseconds. Defaults to 1000 (one second). */
  tickRate?: number
}

const formatter = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Europe/Berlin",
  hour12: false,
})

export function DigitalClock({
  label ,
  className,
  tickRate = 1000,
}: DigitalClockProps) {
  const [timeString, setTimeString] = React.useState<string | null>(null)

  // React Hook that updates the time based on the Tick Rate
  React.useEffect(() => {
    const updateTime = () => {
      setTimeString(formatter.format(new Date()))
    }
    updateTime()

    // Set up an interval to update the time at the specified tick rate
    const interval = window.setInterval(updateTime, Math.max(250, tickRate))
    
    return () => window.clearInterval(interval)
  }, [tickRate])

  return (
    <div
      className={cn(
        "group flex flex-col items-end justify-center gap-1 rounded-xl border border-white/10 bg-white/5 my-4 px-4 py-2 text-xs uppercase tracking-[0.18em] text-muted-foreground backdrop-blur-md transition-colors duration-300 dark:border-white/5 dark:bg-white/5",
        className
      )}
      aria-label={`Current time in ${label}`}
    >
      <span className="text-[0.65rem] font-semibold leading-none text-muted-foreground/80">
        {label}
      </span>
      <span className="text-lg font-semibold tabular-nums text-foreground">
        {timeString ?? "--:--:--"}
      </span>
    </div>
  )
}

export default DigitalClock
