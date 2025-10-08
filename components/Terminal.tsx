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

export type TerminalLogStatus = "pending" | "running" | "success" | "error"

export interface TerminalLogEntry {
  id: string
  label: string
  detail?: string
  status?: TerminalLogStatus
  /** ISO timestamp or Date used for display. */
  timestamp?: string | Date
  meta?: string
}

export interface TerminalProps {
  logs: TerminalLogEntry[]
  title?: string
  prompt?: string
  autoScroll?: boolean
  className?: string
  footerNote?: string
}

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

export function Terminal({
  logs,
  title = "Backend terminal",
  prompt = "evcc@backend",
  autoScroll = true,
  className,
  footerNote = "Connected to EV orchestration service",
}: TerminalProps) {
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const previousLength = React.useRef(0)

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
        "relative isolate flex h-full min-h-[320px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/75 via-slate-900/50 to-slate-900/60 shadow-[0_30px_70px_-44px_rgba(236,72,153,0.5)] backdrop-blur-2xl dark:border-white/10 lg:max-h-[calc(100vh-220px)]",
        className
      )}
    >
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-24 top-1/4 h-64 w-64 rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute -left-16 bottom-1/3 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute right-1/3 -bottom-12 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/40 px-5 py-4 backdrop-blur-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <div className="flex flex-col gap-0.5 text-sm text-slate-400">
            {prompt ? (
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                {prompt}
              </span>
            ) : null}
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand shadow-lg ring-1 ring-white/10">
          Live
        </span>
      </header>

      <div className="relative z-10 flex flex-1 min-h-0 flex-col gap-4 px-5 py-4">
        <div
          ref={listRef}
          className="scrollbar-thin flex-1 min-h-0 space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-5 font-mono text-[13px] shadow-lg backdrop-blur-sm dark:text-brand-50"
          aria-live="polite"
        >
          {logs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-slate-400">
              <span>Awaiting backend events…</span>
              <span className="text-xs text-slate-500">
                Start a session to stream execution steps.
              </span>
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
                  className="group flex items-start gap-3 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 shadow-sm backdrop-blur-sm transition hover:border-brand/40 hover:bg-slate-900/60 hover:shadow-md"
                >
                  <span
                    className={cn(
                      "mt-1 inline-flex size-2.5 shrink-0 rounded-full",
                      meta.dotClass
                    )}
                  />
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2 text-brand-50">
                      <Icon
                        className={cn(
                          "size-4",
                          meta.iconClass,
                          status === "running" ? "animate-spin" : undefined
                        )}
                      />
                      <span className="font-semibold text-brand-100">
                        {log.label}
                      </span>
                      {log.meta ? (
                        <span className="text-[11px] uppercase tracking-wider text-slate-400">
                          {log.meta}
                        </span>
                      ) : null}
                      <span className="ml-auto text-[11px] text-slate-500">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    {log.detail ? (
                      <p className="text-[12px] text-slate-400">
                        {log.detail}
                      </p>
                    ) : null}
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">
                      {meta.label}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <footer className="relative z-10 flex items-center justify-between gap-3 border-t border-white/10 bg-slate-950/60 px-5 py-3 text-xs text-slate-400 shadow-lg backdrop-blur-sm">
        <span>{footerNote}</span>
        <span className="font-mono text-brand">status: ok</span>
      </footer>
    </section>
  )
}

export default Terminal