"use client"

import * as React from "react"
import { Info, Play, Power, RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "./ui/button"

type StepKey = "plugged-in" | "ready-to-charge" | "charging" | "completed"
type ActionKey = "start" | "end" | "reset"

export interface EVCCProps {
  status?: StepKey
  /**
   * Normalized charging progress between 0 and 1.
   * Used to fill the connector between the "Charging" and "Completed" steps.
   */
  chargingProgress?: number
  className?: string
  onStart?: () => void
  onEnd?: () => void
  onReset?: () => void
  onInfoClick?: (payload: {
    action: ActionKey
    label: string
    description: string
  }) => void
  actionInfoLabels?: Partial<Record<ActionKey, string>>
}

const STEPS: Array<{ key: StepKey; label: string; description: string }> = [
  {
    key: "plugged-in",
    label: "Plugged-In",
    description: "Connector locked in place",
  },
  {
    key: "ready-to-charge",
    label: "Ready To Charge",
    description: "Vehicle is negotiating session",
  },
  {
    key: "charging",
    label: "Charging",
    description: "Energy flowing to the battery",
  },
  {
    key: "completed",
    label: "Completed",
    description: "Session finished and connector released",
  },
]

const ACTIONS: Array<{
  key: ActionKey
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  variant?: ButtonProps["variant"]
  description: string
}> = [
  {
    key: "start",
    label: "Start",
    icon: Play,
    description: "Kick off a new charging session",
  },
  {
    key: "end",
    label: "End",
    icon: Power,
    description: "Stop the current charging session",
     variant: "secondary",
  },
  {
    key: "reset",
    label: "Reset",
    icon: RotateCcw,
    variant: "outline",
    description: "Clear the session and return to idle",
  },
]

export function EVCC({
  status = "plugged-in",
  chargingProgress = 0,
  className,
  onStart,
  onEnd,
  onReset,
  onInfoClick,
  actionInfoLabels,
}: EVCCProps) {
  const safeStatusIndex = React.useMemo(() => {
    const index = STEPS.findIndex((step) => step.key === status)
    return index === -1 ? 0 : index
  }, [status])

  const clampedCharge = React.useMemo(
    () => Math.min(Math.max(chargingProgress, 0), 1),
    [chargingProgress]
  )

  const totalSegments = STEPS.length - 1
  const filledSegments = React.useMemo(
    () => Math.min(safeStatusIndex, totalSegments),
    [safeStatusIndex, totalSegments]
  )

  const currentStepKey = React.useMemo(
    () => STEPS[safeStatusIndex]?.key,
    [safeStatusIndex]
  )

  const lineProgress = React.useMemo(() => {
    if (totalSegments <= 0) return 1
    if (currentStepKey === "completed") {
      return 1
    }

    if (currentStepKey === "charging") {
      return Math.min(1, (filledSegments + clampedCharge) / totalSegments)
    }

    return Math.min(1, filledSegments / totalSegments)
  }, [currentStepKey, totalSegments, filledSegments, clampedCharge])

  const chargingPercentLabel = React.useMemo(() =>
    `${Math.round(clampedCharge * 100)}%`,
  [clampedCharge])

  const actionHandlers: Record<ActionKey, (() => void) | undefined> = {
    start: onStart,
    end: onEnd,
    reset: onReset,
  }

  return (
    <section
      aria-label="Electric Vehicle Charge Controller"
      className={cn(
        "relative isolate flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/75 via-slate-900/50 to-slate-900/60 px-6 py-6 shadow-[0_30px_70px_-44px_rgba(236,72,153,0.5)] backdrop-blur-2xl dark:border-white/10",
        className
      )}
    >
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-24 top-1/4 h-64 w-64 rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute -left-16 bottom-1/3 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute right-1/3 -bottom-12 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
      </div>

      <header className="relative z-10 mb-4">
        
        <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-3xl font-semibold text-brand-50">EVCC</h2>
          <span className="rounded-full bg-brand/15 px-3.5 py-1.5 text-xl font-semibold uppercase tracking-wider text-brand shadow-lg ring-1 ring-white/10">
            Status: {STEPS[safeStatusIndex]?.label}
          </span>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col lg:flex-row gap-8 min-h-0">
        <div className="space-y-4 lg:w-[200px] shrink-0">
          {ACTIONS.map(({ key, label, icon: Icon, variant, description }) => {
            const infoLabel = actionInfoLabels?.[key] ?? description
            const onClick = actionHandlers[key]

            return (
              <div key={key} className="flex items-center gap-3">
                <Button
                  aria-label={`${label} info`}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full border border-white/10 bg-slate-950/60 text-slate-400 shadow-lg transition hover:border-brand/60 hover:text-brand-50"
                  onClick={() =>
                    onInfoClick?.({
                      action: key,
                      label,
                      description,
                    })
                  }
                >
                  <Info className="size-4" />
                </Button>
                <Button
                  variant={variant}
                  onClick={onClick}
                  className={cn(
                    "flex-1 justify-start gap-3 rounded-2xl shadow-lg transition",
                    variant === "secondary"
                      ? "bg-slate-800/70 text-slate-200 ring-1 ring-white/10 hover:bg-slate-800"
                      : variant === "outline"
                        ? "border-white/10 bg-slate-950/60 text-slate-300 hover:border-brand/70 hover:text-brand-50"
                        : "bg-gradient-to-r from-brand/90 via-brand to-brand/80 text-white shadow-[0_0_30px_rgba(236,72,153,0.3)] hover:from-brand/80 hover:via-brand/90 hover:to-brand"
                  )}
                >
                  <Icon className="size-6" aria-hidden />
                  <span className="text-3xl font-semibold">{label}</span>
                </Button>
                <span className="sr-only">{infoLabel}</span>
              </div>
            )
          })}
        </div>

        <div className="relative flex flex-1 flex-col rounded-3xl border border-white/10 bg-slate-950/60 p-5 pb-20 shadow-lg backdrop-blur-sm min-h-0">
          <div className="relative flex h-full min-h-full flex-1 justify-between">
            <div className="absolute left-[22px] top-0 bottom-0 w-1.5 overflow-hidden rounded-full bg-slate-950/70 ring-1 ring-white/10">
              <div
                aria-hidden
                className="absolute inset-0 origin-top rounded-full bg-gradient-to-b from-brand/70 via-brand to-brand/60 shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-transform duration-700 ease-out"
                style={{ transform: `scaleY(${lineProgress})` }}
              />
            </div>

            <ul className="flex w-full h-full flex-1 flex-col gap-y-4 pb-4 pl-0">
              {STEPS.map((step, index) => {
                const isActive = index === safeStatusIndex
                const isComplete =
                  index < safeStatusIndex ||
                  (step.key === "charging" && currentStepKey === "charging") ||
                  (step.key === "completed" && currentStepKey === "completed")
                const isChargingStep = step.key === "charging"
                const isLastStep = index === STEPS.length - 1

                return (
                  <li key={step.key} className={cn("flex items-start gap-6", isLastStep ? "mt-auto" : "")}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <div className="relative flex shrink-0 flex-col items-center">
                      <span
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all",
                          isComplete
                            ? "border-brand bg-brand text-white shadow-[0_0_20px_rgba(236,72,153,0.6)]"
                            : isActive
                              ? "border-brand/80 bg-slate-900 text-brand shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                              : "border-white/10 bg-slate-950/60 text-slate-400"
                        )}
                      >
                        <span className="text-2xl font-semibold">{index + 1}</span>
                      </span>
                    </div>
                    <div className="space-y-1 pt-1">
                      <p
                        className={cn(
                          "text-3xl font-semibold",
                          isActive || isComplete ? "text-brand-50" : "text-slate-400"
                        )}
                      >
                        {isChargingStep && safeStatusIndex === index && safeStatusIndex !== STEPS.length - 1
                          ? `${step.label} • ${chargingPercentLabel}`
                          : step.label}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <footer className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl bg-slate-950/60 px-3.5 py-2.5 text-slate-400 shadow-lg ring-1 ring-white/10 backdrop-blur">
            <span className="text-3xl font-semibold">Charging progress</span>
            <span className="text-3xl font-semibold text-brand-50">
              {currentStepKey === "completed" ? "Done" : chargingPercentLabel}
            </span>
          </footer>
        </div>
      </div>
    </section>
  )
}

export default EVCC