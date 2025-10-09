"use client"

import * as React from "react"
import { animate } from "animejs"
import {
  CheckCircle2,
  Clock3,
  Loader2,
  XCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"

// Define Terminal State Props
export type TerminalLogStatus = "pending" | "running" | "success" | "error"

// Define Terminal Log Entry Structure
export interface TerminalLogEntry {
  id: string
  label: string
  detail?: string
  status?: TerminalLogStatus
  /** ISO timestamp or Date used for display. */
  timestamp?: string | Date
  meta?: string
}

// Define Terminal Component Props
export interface TerminalProps {
  logs: TerminalLogEntry[]
  title?: string
  prompt?: string
  autoScroll?: boolean
  className?: string
  footerNote?: string
}

// Status Metadata for Icons and Styles - This is just Mock Data
const STATUS_META: Record<
  TerminalLogStatus,
  {
    label: string
    dotClass: string
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    iconClass: string
  }
> = {
  pending: {
    label: "Pending",
    dotClass: "bg-muted",
    icon: Clock3,
    iconClass: "text-muted-foreground",
  },
  running: {
    label: "Running",
    dotClass: "bg-brand",
    icon: Loader2,
    iconClass: "text-brand",
  },
  success: {
    label: "Completed",
    dotClass: "bg-brand",
    icon: CheckCircle2,
    iconClass: "text-emerald-400",
  },
  error: {
    label: "Failed",
    dotClass: "bg-destructive",
    icon: XCircle,
    iconClass: "text-destructive",
  },
}

// This just formates the Timestamp for every Log Entry into a human readable format - Currently not in use
function formatTimestamp(value?: string | Date) {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}



// Optimized Terminal Component with the React Memoization to prevent unnecessary re-renders
export const Terminal = React.memo(function Terminal({
  logs,
  title = "Backend terminal",
  prompt = "evcc@backend",
  autoScroll = true,
  className,
  footerNote = "Connected to EV orchestration service",
}: TerminalProps) {
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const previousLength = React.useRef(0)

  // Effect to handle auto-scrolling and animations on new log entries
  React.useEffect(() => {
    if (!listRef.current) return
    const currentLength = logs.length

    if (currentLength === previousLength.current) return

    if (currentLength < previousLength.current) {
      previousLength.current = currentLength
      return
    }

    const nodes = Array.from(
      listRef.current.querySelectorAll<HTMLElement>("[data-terminal-line]")
    )
    const newNodes = nodes.slice(previousLength.current)

    newNodes.forEach((node, index) => {
      animate(node, {
        opacity: [0, 1],
        translateX: [-16, 0],
        duration: 420,
        delay: index * 40,
        easing: "easeOutQuad",
      })
    })

    if (autoScroll && newNodes.length > 0) {
      newNodes[newNodes.length - 1]?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      })
    }

    previousLength.current = currentLength
  }, [logs, autoScroll])

  return (
    <section
      className={cn(
        "relative isolate flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 shadow-lg dark:border-white/10",
        className
      )}
    >
      <header className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950 px-5 py-4">
        <div>
          <p className="text-3xl font-semibold uppercase tracking-wider text-brand-50">
            {title}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-5 py-3 text-3xl font-semibold uppercase tracking-wider text-muted-foreground shadow-lg ring-1 ring-white/10">
          Live
        </span>
      </header>

      <div className="relative z-10 flex flex-1 min-h-0 flex-col gap-4 px-5 py-4">
        <div
          ref={listRef}
          className="scrollbar-thin flex-1 min-h-0 space-y-4 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 px-4 py-5 font-mono shadow-lg dark:text-brand-50"
          aria-live="polite"
        >
          {logs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-400">
              <span className="text-3xl font-semibold">Awaiting backend events…</span>
            </div>
          ) : (
            logs.map((log) => {
              const status = log.status ?? "pending"
              const meta = STATUS_META[status]
              const Icon = meta.icon

              return (
                <div
                  key={log.id}
                  data-terminal-line
                  className="group flex items-start gap-4 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 shadow-sm transition hover:border-brand/40 hover:bg-slate-800 hover:shadow-md"
                >
                  <div className="flex flex-1 items-center gap-4">
                    <Icon
                      className={cn(
                        "size-8 shrink-0",
                        meta.iconClass,
                        status === "running" ? "animate-spin" : undefined
                      )}
                    />
                    <span className="text-3xl font-semibold text-brand-100">
                      {log.label}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <footer className="relative z-10 flex items-center justify-between gap-3 border-t border-white/10 bg-slate-950 px-5 py-3 text-slate-400 shadow-lg">
        <span className="text-3xl font-semibold">{footerNote}</span>
      </footer>
    </section>
  )
})

export default Terminal