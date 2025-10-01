"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type StepStatus = "upcoming" | "active" | "completed"

export interface ProgressStep {
  id: string
  title: string
  description?: string
  status?: StepStatus
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

const DEFAULT_STEPS: ProgressStep[] = [
  { id: "step-1", title: "Step 1" },
  { id: "step-2", title: "Step 2" },
  { id: "step-3", title: "Step 3" },
  { id: "step-4", title: "Step 4" },
  { id: "step-5", title: "Step 5" },
  { id: "step-6", title: "Step 6" },
  { id: "step-7", title: "Step 7" },
]

export function ProgressBar({
  steps = DEFAULT_STEPS,
  currentStepId,
  currentStepIndex,
  progress = 0,
  className,
  showDescriptions = false,
  ariaLabel = "Process timeline",
}: ProgressBarProps) {
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

      if (leftStatus === "active") {
        return clampedProgress
      }

      if (leftStatus === "completed" && rightStatus === "active") {
        return clampedProgress
      }

      return 0
    })
  }, [safeSteps.length, statuses, clampedProgress])

  if (safeSteps.length === 0) {
    return null
  }

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-6 shadow-sm backdrop-blur",
        "before:absolute before:-right-24 before:top-1/2 before:h-72 before:w-72 before:-translate-y-1/2 before:rounded-full before:bg-brand/10 before:blur-3xl before:content-['']",
        className
      )}
      aria-label={ariaLabel}
    >
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
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

      <div className="overflow-x-auto pb-4">
        <div
          className="relative mx-auto grid max-w-5xl items-start gap-x-3"
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
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                      isCompleted
                        ? "border-brand bg-brand text-brand-foreground shadow-glow"
                        : isActive
                          ? "border-brand bg-card text-brand"
                          : "border-border/70 bg-card text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="mt-3 space-y-1">
                    <p
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
                  <div className="col-span-1 flex h-12 items-center">
                    <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-brand via-brand to-brand/80 transition-[width] duration-500 ease-out"
                        style={{ width: `${connectors[index] * 100}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <span>
          Step {Math.max(activeIndex + 1, Math.min(completedCount, safeSteps.length))}
          /{safeSteps.length}
        </span>
        <span className="font-semibold text-foreground">
          {activeIndex >= 0 ? safeSteps[activeIndex]?.title : "Not started"}
        </span>
      </footer>
    </section>
  )
}

export default ProgressBar