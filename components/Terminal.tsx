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
        "relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-sm backdrop-blur lg:max-h-[calc(100vh-220px)]",
        className
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border/50 bg-white/60 px-5 py-4 dark:bg-black/20">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {title}
          </p>
          <div className="flex flex-col gap-0.5 text-sm text-muted-foreground/80">
            {prompt ? (
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground/60">
                {prompt}
              </span>
            ) : null}
          </div>
        </div>
  <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
          Live
        </span>
      </header>

      <div className="flex flex-1 min-h-0 flex-col gap-4 px-5 py-4">
        <div
          ref={listRef}
          className="scrollbar-thin flex-1 min-h-0 space-y-3 overflow-y-auto rounded-2xl bg-white/90 px-4 py-5 font-mono text-[13px] text-slate-800 shadow-inner dark:bg-[#05030a]/92 dark:text-brand-50"
          aria-live="polite"
        >
          {logs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <span>Awaiting backend events…</span>
              <span className="text-xs text-muted-foreground/70">
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
                  className="group flex items-start gap-3 rounded-xl border border-white/80 bg-white/75 px-3 py-2 transition hover:border-brand/40 hover:bg-white dark:border-transparent dark:bg-white/[0.02] dark:hover:border-brand/30 dark:hover:bg-white/[0.05]"
                >
                  <span
                    className={cn(
                      "mt-1 inline-flex size-2.5 shrink-0 rounded-full",
                      meta.dotClass
                    )}
                  />
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2 text-slate-900 dark:text-brand-50">
                      <Icon
                        className={cn(
                          "size-4",
                          meta.iconClass,
                          status === "running" ? "animate-spin" : undefined
                        )}
                      />
                      <span className="font-semibold text-foreground dark:text-brand-100">
                        {log.label}
                      </span>
                      {log.meta ? (
                        <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground dark:text-brand-200/80">
                          {log.meta}
                        </span>
                      ) : null}
                      <span className="ml-auto text-[11px] text-muted-foreground/80 dark:text-brand-300/70">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    {log.detail ? (
                      <p className="text-[12px] text-muted-foreground dark:text-brand-200/80">
                        {log.detail}
                      </p>
                    ) : null}
                    <span className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground/80 dark:text-brand-300/60">
                      {meta.label}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-border/50 bg-white/70 px-5 py-3 text-xs text-muted-foreground dark:bg-black/20">
        <span>{footerNote}</span>
        <span className="font-mono text-brand">status: ok</span>
      </footer>
    </section>
  )
}

export default Terminal