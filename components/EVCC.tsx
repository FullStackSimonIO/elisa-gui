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
        "relative isolate overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-5 shadow-sm backdrop-blur",
        "before:absolute before:-right-28 before:top-1/2 before:h-72 before:w-72 before:-translate-y-1/2 before:rounded-full before:bg-primary/15 before:blur-3xl before:content-['']",
        className
      )}
    >
      <header className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Electric Vehicle Charging Controller</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-2xl font-semibold text-foreground">EVCC</h2>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Status: {STEPS[safeStatusIndex]?.label}
          </span>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
        <div className="space-y-4">
          {ACTIONS.map(({ key, label, icon: Icon, variant, description }) => {
            const infoLabel = actionInfoLabels?.[key] ?? description
            const onClick = actionHandlers[key]

            return (
              <div key={key} className="flex items-center gap-3">
                <Button
                  aria-label={`${label} info`}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full border border-border/60 bg-card/70 text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
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
                    "flex-1 justify-start gap-3 rounded-2xl text-base font-semibold shadow-sm transition",
                    variant === "secondary"
                      ? "bg-secondary/70 text-secondary-foreground hover:bg-secondary"
                      : variant === "outline"
                        ? "border-border/70 bg-card text-muted-foreground hover:border-primary/70 hover:text-background"
                        : "bg-gradient-to-r from-primary/90 via-primary to-primary/80 text-primary-foreground hover:from-primary/80 hover:via-primary/90 hover:to-primary"
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  <span className="text-base font-semibold">{label}</span>
                </Button>
                <span className="sr-only">{infoLabel}</span>
              </div>
            )
          })}
        </div>

        <div className="relative flex flex-1 flex-col rounded-3xl border border-border/60 bg-card/70 p-5 pb-20">
          <div className="relative flex h-full flex-1 justify-between">
            <div className="absolute left-[22px] top-0 bottom-0 w-1.5 overflow-hidden rounded-full bg-muted">
              <div
                aria-hidden
                className="absolute inset-0 origin-top rounded-full bg-gradient-to-b from-primary/70 via-primary to-primary/60 transition-transform duration-700 ease-out"
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
                          "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all",
                          isComplete
                            ? "border-primary bg-primary text-primary-foreground shadow-glow"
                            : isActive
                              ? "border-primary/80 bg-card text-primary"
                              : "border-border/70 bg-card text-muted-foreground"
                        )}
                      >
                        <span className="text-sm font-semibold">{index + 1}</span>
                      </span>
                    </div>
                    <div className="space-y-1 pt-1">
                      <p
                        className={cn(
                          "text-base font-semibold",
                          isActive || isComplete ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {isChargingStep && safeStatusIndex === index && safeStatusIndex !== STEPS.length - 1
                          ? `${step.label} • ${chargingPercentLabel}`
                          : step.label}
                      </p>
                      <p className="text-sm text-muted-foreground/80">{step.description}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <footer className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl bg-muted/30 px-3.5 py-2.5 text-sm text-muted-foreground">
            <span>Charging progress</span>
            <span className="font-semibold text-foreground">
              {currentStepKey === "completed" ? "Done" : chargingPercentLabel}
            </span>
          </footer>
        </div>
      </div>
    </section>
  )
}

export default EVCC