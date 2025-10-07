"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import { cn } from "@/lib/utils"

import "react-clock/dist/Clock.css"
import "./clock-card.css"

const Clock = dynamic(() => import("react-clock"), { ssr: false })

export interface ClockCardProps {
  className?: string
  label?: string
  timeZone?: string
  showDate?: boolean
  tickRate?: number
}

const dateFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone,
  })

const timeFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
    hour12: false,
  })

export function ClockCard({
  className,
  label = "Berlin",
  timeZone = "Europe/Berlin",
  showDate = true,
  tickRate = 1000,
}: ClockCardProps) {
  const [now, setNow] = React.useState<Date | null>(null)

  React.useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const id = window.setInterval(tick, Math.max(500, tickRate))
    return () => window.clearInterval(id)
  }, [tickRate])

  const dateLabel = React.useMemo(() => {
    if (!now) return "--"
    return dateFormatter(timeZone).format(now)
  }, [now, timeZone])

  const timeLabel = React.useMemo(() => {
    if (!now) return "--:--"
    return timeFormatter(timeZone).format(now)
  }, [now, timeZone])

  return (
    <article
      className={cn(
        "relative flex h-full flex-col items-center justify-between rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/10 px-6 py-6 text-center shadow-[0_28px_64px_-42px_rgba(236,72,153,0.45)] backdrop-blur-2xl transition-colors duration-500 dark:border-white/10 dark:from-slate-950/60 dark:via-slate-950/45 dark:to-slate-950/55",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-16 top-8 h-48 w-48 rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <header className="flex w-full flex-col items-center">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-muted-foreground">
          {label}
        </span>
        <span className="mt-1 text-xs uppercase tracking-[0.4em] text-muted-foreground/70">
          {timeZone.replace("/", " • ")}
        </span>
      </header>

      <div className="relative mt-6 aspect-square w-full max-w-xs">
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-brand-400/15 via-transparent to-primary/10 blur-2xl" />
        {now ? (
          <Clock
            value={now}
            renderNumbers
            minuteHandWidth={3}
            hourHandWidth={4}
            secondHandWidth={1.5}
            renderMinuteMarks
            renderSecondHand
            className="w-full border border-white/10 bg-gradient-to-br from-slate-950/70 via-slate-900/50 to-slate-800/40 p-3 shadow-inner ring-1 ring-white/10 dark:border-white/10"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full border border-dashed border-white/10 text-sm text-muted-foreground/60">
            Loading…
          </div>
        )}
      </div>

      <footer className="mt-6 flex flex-col items-center gap-1">
        <span className="text-lg font-semibold tracking-[0.3em] text-foreground">
          {timeLabel}
        </span>
        {showDate && (
          <span className="text-xs uppercase tracking-[0.35em] text-muted-foreground/70">
            {dateLabel}
          </span>
        )}
      </footer>
    </article>
  )
}

export default ClockCard
