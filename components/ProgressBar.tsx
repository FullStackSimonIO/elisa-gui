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
    description: "Vehicle requests session",
    terminalLabel: "Handshake - Requesting Session",
  },
  {
    id: "authorization",
    title: "Authorization",
    description: "Driver profile verified",
    terminalLabel: "Authorization - Profile Verified",
  },
  {
    id: "connector-lock",
    title: "Connector Lock",
    description: "Plug secured",
    terminalLabel: "Connector Lock - Plug Secured",
  },
  {
    id: "precharge",
    title: "Pre-Charge",
    description: "Voltage aligned",
    terminalLabel: "Pre-Charge - Voltage Aligned",
  },
  {
    id: "ramp-up",
    title: "Ramp Up",
    description: "Current increases",
    terminalLabel: "Ramp Up - Current Increasing",
  },
  {
    id: "steady",
    title: "Steady State",
    description: "Charging at target rate",
    terminalLabel: "Steady State - Charging at Target Rate",
  },
  {
    id: "thermal-check",
    title: "Thermal Check",
    description: "Cooling system validation",
    terminalLabel: "Thermal Check - Cooling Validated",
  },
  {
    id: "taper",
    title: "Taper",
    description: "Current reduces near full",
    terminalLabel: "Taper - Current Reducing Near Full",
  },
  {
    id: "top-off",
    title: "Top Off",
    description: "Balancing individual cells",
    terminalLabel: "Top Off - Balancing Cells",
  },
  {
    id: "complete",
    title: "Complete",
    description: "Ready to disconnect",
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
      if (index === inferredActiveIndex) return "active"
      return "upcoming"
    })
  }, [inferredActiveIndex, safeSteps])

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
            scale: [1, 1.08],
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
        "relative isolate overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-5 shadow-sm backdrop-blur",
        "before:absolute before:-right-24 before:top-1/2 before:h-72 before:w-72 before:-translate-y-1/2 before:rounded-full before:bg-brand/10 before:blur-3xl before:content-['']",
        className
      )}
      aria-label={ariaLabel}
    >
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Charging
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Progress:
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
          <span className="h-2 w-2 rounded-full bg-brand" aria-hidden />
          {Math.round((ariaValue / safeSteps.length) * 100)}% complete
        </span>
      </header>

      <div className="overflow-x-auto py-3 ">
        <div
          className="relative mx-2 grid  items-start gap-x-3"
          style={{
            gridTemplateColumns: `repeat(${safeSteps.length * 2 - 1}, minmax(64px, 1fr))`,
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
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                      isCompleted
                        ? "border-brand bg-brand text-brand-foreground shadow-glow"
                        : isActive
                          ? "border-black bg-card text-brand "
                          : "border-border/70 bg-card text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="mt-3 space-y-1">
                    <p
                      ref={(node) => {
                        stepLabelRefs.current[index] = node
                      }}
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wide",
                        isCompleted || isActive
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </p>
                    {showDescriptions && step.description ? (
                      <p className="text-[11px] text-muted-foreground">
                        {step.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                {index < safeSteps.length - 1 ? (
                  <div className="col-span-1 flex h-10 items-center">
                    <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        ref={(node) => {
                          connectorRefs.current[index] = node
                        }}
                        className="absolute left-0 top-0 h-full w-full origin-left rounded-full bg-gradient-to-r from-brand via-brand to-brand/80"
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