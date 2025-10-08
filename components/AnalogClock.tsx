"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Each Number between 0-9 is represented by a digit character
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const
type DigitChar = (typeof DIGITS)[number] 
const DIGIT_HEIGHT_REM = 4.2
const DIGIT_WIDTH_REM = 3

// Interface for the current time state
interface ClockSnapshot {
  segments: string[]
  timeLabel: string
  dateLabel: string
}

// Actual Types for the Digital Clock Component are defined here
export interface AnalogClockProps {
  label?: string
  timeZone?: string
  tickRate?: number
  className?: string
  showSeconds?: boolean
  showDate?: boolean
}

// Type Guard for Digit Characters
function isDigitChar(value: string): value is DigitChar {
  return DIGITS.includes(value as DigitChar)
}

// This Function uses the Array of Digits and creates the Ticker for each digit
function DigitTicker({ value, reduceMotion }: { value: string; reduceMotion: boolean }) {
  const safeValue: DigitChar = isDigitChar(value) ? value : DIGITS[0]
  const index = DIGITS.indexOf(safeValue)

  return (
    <div
      className="relative overflow-hidden rounded-[20px] bg-slate-950/75 shadow-[0_30px_60px_-40px_rgba(236,72,153,0.55)] ring-1 ring-white/10"
      style={{
        height: `${DIGIT_HEIGHT_REM}rem`,
        width: `${DIGIT_WIDTH_REM}rem`,
      }}
    >
      <div
        className="flex flex-col text-5xl font-semibold tabular-nums text-brand-50"
        style={{
          transform: `translateY(-${index * DIGIT_HEIGHT_REM}rem)`,
          transition: reduceMotion ? "none" : "transform 0.6s cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: reduceMotion ? "auto" : "transform",
        }}
      >
        {DIGITS.map((digit) => (
          <span
            key={digit}
            className="flex items-center justify-center"
            style={{
              height: `${DIGIT_HEIGHT_REM}rem`,
              width: `${DIGIT_WIDTH_REM}rem`,
            }}
            aria-hidden
          >
            {digit}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-gradient-to-b from-white/6 via-transparent to-white/12 mix-blend-screen" />
    </div>
  )
}

// This Component represents the Colon between Hours, Minutes and Seconds
function Colon() {
  return (
    <span className="relative flex h-[4.2rem] w-[1.5rem] items-center justify-center text-5xl font-semibold text-brand-100/85 drop-shadow-[0_0_12px_rgba(236,72,153,0.45)] animate-[pulse_2s_ease-in-out_infinite]">
      <span className="relative">:</span>
    </span>
  )
}

// Here, the State of the current time is built and formatted based on the Timezone and whether to show seconds
function buildSnapshot(timeZone: string, showSeconds: boolean): ClockSnapshot {
  const now = new Date()

  // Using Intl.DateTimeFormat to format time and date based on locale and timezone
  const timeFormatter = new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
  })

  // Formatter for the date part
  const dateFormatter = new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone,
  })

  // Extracting parts of the formatted time to get hours, minutes, and seconds
  const parts = timeFormatter.formatToParts(now)
  const lookup = (type: "hour" | "minute" | "second") =>
    parts.find((part) => part.type === type)?.value ?? "00"

  const hours = lookup("hour").padStart(2, "0")
  const minutes = lookup("minute").padStart(2, "0")
  const seconds = lookup("second").padStart(2, "0")

  const segments = [...hours.split(""), ":", ...minutes.split("")]
  const timeLabel = `${hours}:${minutes}`

  if (showSeconds) {
    segments.push(":", ...seconds.split(""))
  }

  return {
    segments,
    timeLabel: showSeconds ? `${timeLabel}:${seconds}` : timeLabel,
    dateLabel: dateFormatter.format(now),
  }
}



// Main Analog Clock Component
export function AnalogClock({
  label = "Berlin",
  timeZone = "Europe/Berlin",
  tickRate = 1000,
  className,
  showSeconds = true,
  showDate = true,
}: AnalogClockProps) {
  const [reduceMotion, setReduceMotion] = React.useState(false) // State to respect user preference for reduced motion
  const [snapshot, setSnapshot] = React.useState<ClockSnapshot>(() => buildSnapshot(timeZone, showSeconds)) // Initial state of the clock

  // 
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handleChange = () => setReduceMotion(media.matches)
    handleChange()
    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [])

  // Update the Clock based on chosen Tickrate
  React.useEffect(() => {
    if (typeof window === "undefined") return

    const update = () => setSnapshot(buildSnapshot(timeZone, showSeconds))
    update()


    const intervalId = window.setInterval(update, Math.max(250, tickRate))
    return () => window.clearInterval(intervalId)
  }, [showSeconds, tickRate, timeZone])

  return (
    <article
      className={cn(
        "relative flex h-full min-h-[15rem] flex-col items-center justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/75 via-slate-900/50 to-slate-900/60 px-6 py-6 text-center text-xs uppercase tracking-[0.32em] text-muted-foreground backdrop-blur-2xl shadow-[0_30px_70px_-44px_rgba(236,72,153,0.5)] dark:border-white/10",
        className
      )}
      aria-label={`Digital clock for ${label}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-16 top-10 h-48 w-48 rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute right-0 top-16 h-56 w-56 rounded-full bg-brand-300/20 blur-3xl" />
        <div className="absolute inset-x-[18%] bottom-0 h-40 rounded-full bg-primary/12 blur-[120px]" />
      </div>

      <header className="flex flex-col items-center gap-2 mt-12">
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-50">
          {label}
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-300">
                {showDate ? <span>{snapshot.dateLabel}</span> : null}
        </span>
        <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">
          {timeZone.replace("/", " • ")}
        </span>
        

      </header>

      <div className="flex flex-1 items-center justify-center mt-4">
        <div className="flex items-end gap-3">
          {snapshot.segments.map((segment, index) =>
            segment === ":" ? (
              <Colon key={`colon-${index}`} />
            ) : (
              <DigitTicker key={`digit-${index}`} value={segment} reduceMotion={reduceMotion} />
            )
          )}
        </div>
      </div>
    </article>
  )
}

export default AnalogClock
