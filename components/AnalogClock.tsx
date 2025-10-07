"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type TimeParts = {
  hours: number
  minutes: number
  seconds: number
  timeLabel: string
  dateLabel: string
}

export interface AnalogClockProps {
  /** Visual label rendered beneath the dial. */
  label?: string
  /** IANA timezone identifier. Defaults to Europe/Berlin. */
  timeZone?: string
  /** Milliseconds between updates. */
  tickRate?: number
  /** Additional classes for the outer wrapper. */
  className?: string
}

const TICKS = Object.freeze(Array.from({ length: 12 }, (_, index) => index))

function resolveTimeParts(timeZone: string): TimeParts {
  const now = new Date()

  const timeFormatter = new Intl.DateTimeFormat("de-DE", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
    timeZone,
  })

  const dateFormatter = new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone,
  })

  const parts = timeFormatter.formatToParts(now)

  const lookup = (type: "hour" | "minute" | "second") =>
    parseInt(parts.find((part) => part.type === type)?.value ?? "0", 10)

  return {
    hours: lookup("hour"),
    minutes: lookup("minute"),
    seconds: lookup("second"),
    timeLabel: timeFormatter.format(now),
    dateLabel: dateFormatter.format(now),
  }
}

export function AnalogClock({
  label = "Berlin",
  timeZone = "Europe/Berlin",
  tickRate = 1000,
  className,
}: AnalogClockProps) {
  const [parts, setParts] = React.useState<TimeParts | null>(null)

  React.useEffect(() => {
    let frame: number | null = null
    let interval: number | null = null

    const update = () => {
      setParts(resolveTimeParts(timeZone))
      frame = null
    }

    const schedule = () => {
      frame = window.requestAnimationFrame(update)
    }

    schedule()
    interval = window.setInterval(schedule, Math.max(500, tickRate))

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame)
      }
      if (interval !== null) {
        window.clearInterval(interval)
      }
    }
  }, [timeZone, tickRate])

  const hours = parts?.hours ?? 0
  const minutes = parts?.minutes ?? 0
  const seconds = parts?.seconds ?? 0

  const hourAngle = React.useMemo(() => ((hours % 12) + minutes / 60 + seconds / 3600) * 30, [hours, minutes, seconds])
  const minuteAngle = React.useMemo(() => (minutes + seconds / 60) * 6, [minutes, seconds])
  const secondAngle = React.useMemo(() => seconds * 6, [seconds])

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/10 px-5 py-4 text-xs uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-xl shadow-[0_22px_60px_-40px_rgba(235,56,120,0.45)] dark:border-white/10 dark:from-slate-950/60 dark:via-slate-950/40 dark:to-slate-950/50",
        className
      )}
      aria-label={`Analog clock for ${label}`}
    >
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-slate-950/70 via-slate-900/50 to-slate-800/40 p-3 shadow-inner ring-1 ring-white/10">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 via-transparent to-brand/30 opacity-40" />
        <div className="absolute inset-[8%] rounded-full border border-white/10" />

  {TICKS.map((tick: number) => (
          <span
            key={tick}
            className="absolute h-[10%] w-[2px] origin-bottom rounded-full bg-white/30"
            style={{ transform: `rotate(${tick * 30}deg) translateY(-90%)` }}
          />
        ))}

        <span
          className="absolute bottom-1/2 left-1/2 h-8 w-[3px] origin-bottom rounded-full bg-white/80"
          style={{ transform: `translate(-50%, 0) rotate(${hourAngle}deg)` }}
        />
        <span
          className="absolute bottom-1/2 left-1/2 h-[46%] w-[2px] origin-bottom rounded-full bg-white/70"
          style={{ transform: `translate(-50%, 0) rotate(${minuteAngle}deg)` }}
        />
        <span
          className="absolute bottom-1/2 left-1/2 h-[52%] w-[1.5px] origin-bottom rounded-full bg-brand/90"
          style={{ transform: `translate(-50%, 0) rotate(${secondAngle}deg)` }}
        />

        <span className="absolute h-3 w-3 rounded-full bg-brand drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]" />
      </div>

      <div className="flex flex-col items-center gap-1 leading-tight tracking-[0.26em]">
        <span className="text-[0.6rem] font-semibold text-muted-foreground/80">{label}</span>
        <span className="text-[0.7rem] font-semibold">
          {parts?.timeLabel ?? "--:--:--"}
        </span>
        <span className="text-[0.55rem] font-medium tracking-[0.38em] text-muted-foreground/70">
          {parts?.dateLabel ?? "---"}
        </span>
      </div>
    </div>
  )
}

export default AnalogClock
