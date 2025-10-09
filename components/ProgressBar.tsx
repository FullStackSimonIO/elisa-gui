"use client"

import * as React from "react"
import { animate } from "animejs"

import { cn } from "@/lib/utils"

export type StepStatus = "upcoming" | "active" | "completed"

export interface ProgressStep {
  id: string
  title: string
  description?: string
  status?: StepStatus
  /** Optional label to display in the terminal once the step completes. */
  terminalLabel?: string
}

export interface ProgressBarProps {
  steps?: ProgressStep[]
  /**
   * Active step identifier. If not provided, falls back to `currentStepIndex`.
   */
  currentStepId?: string
  /**
   * Zero-based index of the active step. Ignored when `currentStepId` is supplied.
   */
  currentStepIndex?: number
  /**
   * Normalized progress (0-1) within the active step, used to partially fill the next connector.
   */
  progress?: number
  className?: string
  showDescriptions?: boolean
  ariaLabel?: string
}

export const CHARGING_PROGRESS_STEPS = [
  {
    id: "handshake",
    title: "Handshake",

    terminalLabel: "Handshake - Requesting Session",
  },
  {
    id: "authorization",
    title: "Authorization",

    terminalLabel: "Authorization - Profile Verified",
  },
  {
    id: "connector-lock",
    title: "Connector",
    terminalLabel: "Connector Lock - Plug Secured",
  },

  {
    id: "ramp-up",
    title: "Ramp Up",
    terminalLabel: "Ramp Up - Current Increasing",
  },
  {
    id: "steady",
    title: "Steady",
    terminalLabel: "Steady State - Charging at Target Rate",
  },
  {
    id: "thermal-check",
    title: "Thermal",

    terminalLabel: "Thermal Check - Cooling Validated",
  },
  {
    id: "taper",
    title: "Taper",
    terminalLabel: "Taper - Current Reducing Near Full",
  },
  {
    id: "top-off",
    title: "Top Off",

    terminalLabel: "Top Off - Balancing Cells",
  },
  {
    id: "complete",
    title: "Complete",

    terminalLabel: "Complete - Ready to Disconnect",
  },
] satisfies ProgressStep[]

const DEFAULT_STEPS: ProgressStep[] = CHARGING_PROGRESS_STEPS

export function ProgressBar({
  steps = DEFAULT_STEPS,
  currentStepId,
  currentStepIndex,
  progress = 0,
  className,
  showDescriptions = false,
  ariaLabel = "Process timeline",
}: ProgressBarProps) {
  const stepBubbleRefs = React.useRef<Array<HTMLSpanElement | null>>([])
  const stepLabelRefs = React.useRef<Array<HTMLParagraphElement | null>>([])
  const connectorRefs = React.useRef<Array<HTMLDivElement | null>>([])
  const prevStatusesRef = React.useRef<Array<StepStatus>>([])
  const prevConnectorValuesRef = React.useRef<Array<number>>([])

  const safeSteps = React.useMemo(
    () => (steps.length > 0 ? steps : DEFAULT_STEPS),
    [steps]
  )

  const clampedProgress = React.useMemo(
    () => Math.min(Math.max(progress, 0), 1),
    [progress]
  )

  const inferredActiveIndex = React.useMemo(() => {
    if (currentStepId) {
      const index = safeSteps.findIndex((step) => step.id === currentStepId)
      if (index !== -1) {
        return index
      }
    }

    if (
      typeof currentStepIndex === "number" &&
      currentStepIndex >= 0 &&
      currentStepIndex < safeSteps.length
    ) {
      return currentStepIndex
    }

    const firstActiveIndex = safeSteps.findIndex(
      (step) => step.status === "active"
    )
    if (firstActiveIndex !== -1) {
      return firstActiveIndex
    }

    const lastCompleted = safeSteps.findLastIndex(
      (step) => step.status === "completed"
    )
    if (lastCompleted !== -1) {
      return Math.min(lastCompleted + 1, safeSteps.length - 1)
    }

    return safeSteps.length > 0 ? 0 : -1
  }, [currentStepId, currentStepIndex, safeSteps])

  const fallbackStatuses = React.useMemo(() => {
    if (inferredActiveIndex < 0) {
      return safeSteps.map(() => "upcoming" as StepStatus)
    }

    return safeSteps.map((_, index) => {
      if (index < inferredActiveIndex) return "completed"
      // If we're on the last step with full progress, mark it as completed
      if (index === inferredActiveIndex) {
        const isLastStep = index === safeSteps.length - 1
        const hasFullProgress = clampedProgress >= 1
        if (isLastStep && hasFullProgress) return "completed"
        return "active"
      }
      return "upcoming"
    })
  }, [inferredActiveIndex, safeSteps, clampedProgress])

  const statuses = React.useMemo(
    () =>
      safeSteps.map((step, index) => step.status ?? fallbackStatuses[index]),
    [safeSteps, fallbackStatuses]
  )

  const completedCount = React.useMemo(
    () => statuses.filter((status) => status === "completed").length,
    [statuses]
  )

  const activeIndex = React.useMemo(() => {
    const firstExplicit = statuses.findIndex((status) => status === "active")
    if (firstExplicit !== -1) return firstExplicit
    return inferredActiveIndex >= 0 ? inferredActiveIndex : -1
  }, [statuses, inferredActiveIndex])

  const ariaValue = React.useMemo(() => {
    const fractional =
      activeIndex >= 0 && statuses[activeIndex] === "active"
        ? clampedProgress
        : 0
    return Math.min(
      safeSteps.length,
      Number((completedCount + fractional).toFixed(2))
    )
  }, [activeIndex, statuses, clampedProgress, completedCount, safeSteps.length])

  const connectors = React.useMemo(() => {
    if (safeSteps.length <= 1) return [] as number[]

    return Array.from({ length: safeSteps.length - 1 }, (_, index) => {
      const leftStatus = statuses[index]
      const rightStatus = statuses[index + 1]

      if (leftStatus === "completed" && rightStatus === "completed") {
        return 1
      }

      if (leftStatus === "completed" && rightStatus === "active") {
        return 1
      }

      if (leftStatus === "active") {
        // If this is the second-to-last step and we're at full progress, fill the connector
        const isSecondToLastStep = index === safeSteps.length - 2
        if (isSecondToLastStep && clampedProgress >= 1) {
          return 1
        }
        return clampedProgress
      }

      return 0
    })
  }, [safeSteps.length, statuses, clampedProgress])

  React.useEffect(() => {
    prevStatusesRef.current = []
    prevConnectorValuesRef.current = []
  }, [safeSteps.length])

  React.useEffect(() => {
    statuses.forEach((status, index) => {
      const bubble = stepBubbleRefs.current[index]
      const label = stepLabelRefs.current[index]
      const previousStatus = prevStatusesRef.current[index]

      if (bubble && status !== previousStatus) {
        if (status === "active") {
          bubble.style.transformOrigin = "center"
          animate(bubble, {
            scale: [0.85, 1.05],
            duration: 520,
            easing: "easeOutElastic(1, .7)",
          })
        }

        if (status === "completed") {
          bubble.style.transformOrigin = "center"
          animate(bubble, {
            scale: [1, 1.02],
            opacity: [0.95, 1],
            duration: 440,
            easing: "easeOutBack",
          })
        }

        if (status === "upcoming" && previousStatus) {
          animate(bubble, {
            scale: [1.02, 1],
            opacity: [0.9, 1],
            duration: 240,
            easing: "easeOutQuad",
          })
        }
      }

      if (label && status !== previousStatus) {
        if (status === "active" || status === "completed") {
          animate(label, {
            translateY: [-6, 0],
            opacity: [0.65, 1],
            duration: 320,
            easing: "easeOutQuad",
          })
        } else {
          animate(label, {
            opacity: 0.7,
            duration: 200,
            easing: "linear",
          })
        }
      }
    })

    prevStatusesRef.current = [...statuses]
  }, [statuses])

  React.useEffect(() => {
    connectors.forEach((value, index) => {
      const connector = connectorRefs.current[index]
      if (!connector) return

      const nextValue = Math.max(0, Math.min(1, value))
      const previousValueRaw = prevConnectorValuesRef.current[index]
      const previousValue =
        previousValueRaw !== undefined
          ? Math.max(0, Math.min(1, previousValueRaw))
          : 0
      if (previousValue === nextValue) return

      connector.style.transformOrigin = "left"
      connector.style.transform = `scaleX(${previousValue})`

      animate(connector, {
        scaleX: nextValue,
        duration: 500,
        delay: nextValue > previousValue ? 40 : 0,
        easing:
          nextValue > previousValue ? "easeOutCubic" : "easeInOutCubic",
      })
    })

    prevConnectorValuesRef.current = connectors.map((value) =>
      Math.max(0, Math.min(1, value))
    )
  }, [connectors])

  if (safeSteps.length === 0) {
    return null
  }

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/75 via-slate-900/50 to-slate-900/60 px-6 py-4 shadow-[0_30px_70px_-44px_rgba(236,72,153,0.5)] backdrop-blur-2xl dark:border-white/10",
        className
      )}
      aria-label={ariaLabel}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-16 top-10 h-48 w-48 rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute right-0 top-16 h-56 w-56 rounded-full bg-brand-300/20 blur-3xl" />
        <div className="absolute inset-x-[18%] bottom-0 h-40 rounded-full bg-primary/12 blur-[120px]" />
      </div>

      <header className="relative mb-3 flex flex-wrap items-baseline justify-end gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1.5 text-3xl font-semibold uppercase tracking-[0.3em] text-brand-100 shadow-[0_8px_24px_-12px_rgba(236,72,153,0.4)]">
          <span className="h-2 w-2 rounded-full bg-brand-100 animate-pulse" aria-hidden />
          {Math.round((ariaValue / safeSteps.length) * 100)}%
        </span>
      </header>

      <div className="overflow-x-auto py-2">
        <div
          className="relative mx-2 grid items-start gap-x-2"
          style={{
            gridTemplateColumns: `repeat(${safeSteps.length * 2 - 1}, minmax(56px, 1fr))`,
          }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={safeSteps.length}
          aria-valuenow={ariaValue}
          aria-valuetext={
            activeIndex >= 0 ? safeSteps[activeIndex]?.title : undefined
          }
        >
          {safeSteps.map((step, index) => {
            const status = statuses[index]
            const isCompleted = status === "completed"
            const isActive = status === "active"

            return (
              <React.Fragment key={step.id}>
                <div className="col-span-1 flex flex-col items-center text-center">
                  <span
                    ref={(node) => {
                      stepBubbleRefs.current[index] = node
                    }}
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-full border-4 text-2xl font-semibold transition-all will-change-transform",
                      isCompleted
                        ? "border-brand bg-brand text-brand-foreground shadow-[0_0_20px_rgba(236,72,153,0.5)]"
                        : isActive
                          ? "border-brand bg-slate-900/70 text-brand shadow-[0_0_12px_rgba(236,72,153,0.3)]"
                          : "border-white/20 bg-slate-950/60 text-muted-foreground/70"
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="mt-2 space-y-1 min-h-[60px]">
                    <p
                      ref={(node) => {
                        stepLabelRefs.current[index] = node
                      }}
                      className={cn(
                        "text-3xl pt-1 font-semibold uppercase tracking-wide will-change-transform",
                        isCompleted || isActive
                          ? "text-brand-50"
                          : "text-muted-foreground/70"
                      )}
                    >
                      {step.title}
                    </p>
                    {showDescriptions && step.description ? (
                      <p className="text-[11px] text-muted-foreground/60">
                        {step.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                {index < safeSteps.length - 1 ? (
                  <div className="col-span-1 flex h-10 items-center">
                    <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted-foreground ring-1 ring-white/10">
                      <div
                        ref={(node) => {
                          connectorRefs.current[index] = node
                        }}
                        className="absolute left-0 top-0 h-full w-full origin-left rounded-full bg-gradient-to-r from-brand via-brand to-brand/80 shadow-[0_0_12px_rgba(236,72,153,0.4)]"
                        style={{
                          transform: `scaleX(${Math.max(
                            0,
                            Math.min(1, connectors[index])
                          )})`,
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ProgressBar