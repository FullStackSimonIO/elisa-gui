"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import EVCC, { type EVCCProps } from "@/components/EVCC"
import ProgressBar, { CHARGING_PROGRESS_STEPS } from "@/components/ProgressBar"
import ChargingAnimation from "@/components/ChargingAnimation"
import ClockCard from "@/components/ClockCard"
import Terminal from "@/components/Terminal"
import BatteryVisualization from "@/components/BatteryVisualization"
import SmallSkeleton from "@/components/Skeleton/SmallSkeleton"
import { DraggableGrid, type GridItem } from "@/components/DraggableGrid"

const progressSteps = CHARGING_PROGRESS_STEPS

type EVCCInfoClickPayload = Parameters<NonNullable<EVCCProps["onInfoClick"]>>[0]

export default function Page() {
  const [progress, setProgress] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)

  const handleActionInfoClick = useCallback(
    ({ action, label, description }: EVCCInfoClickPayload) => {
      toast(label, {
        id: `evcc-action-${action}`,
        description,
        duration: 4600,
      })
    },
    []
  )

  const startSimulation = useCallback(() => {
    setProgress(0)
    setIsSimulating(true)
  }, [])

  const stopSimulation = useCallback(() => {
    setIsSimulating(false)
  }, [])

  const resetSimulation = useCallback(() => {
    setIsSimulating(false)
    setProgress(0)
  }, [])

  useEffect(() => {
    if (!isSimulating) return
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) return 1
        const next = Math.min(prev + 0.01, 1)
        return next
      })
    }, 60)

    return () => window.clearInterval(interval)
  }, [isSimulating])

  useEffect(() => {
    if (progress >= 1 && isSimulating) {
      setIsSimulating(false)
    }
  }, [progress, isSimulating])
  const evccStatus = useMemo(() => {
    if (progress >= 1) return "completed" as const
    if (isSimulating) return progress > 0 ? "charging" : "ready-to-charge"
    if (progress > 0) return "ready-to-charge"
    return "plugged-in"
  }, [isSimulating, progress])

  const { currentStepIndex, stepProgress } = useMemo(() => {
    if (progress >= 1) {
      return {
        currentStepIndex: progressSteps.length - 1,
        stepProgress: 1,
      }
    }

    const totalSegments = Math.max(progressSteps.length - 1, 1)
    const scaled = progress * totalSegments
    const baseIndex = Math.floor(scaled)
    return {
      currentStepIndex: Math.min(progressSteps.length - 1, Math.max(0, baseIndex)),
      stepProgress: scaled - baseIndex,
    }
  }, [progress])

  const gridItems = useMemo<GridItem[]>(() => [
    {
      id: "clock",
      component: (
        <ClockCard className="h-full min-h-0" label="Berlin" showSeconds={false} />
      ),
    },
    {
      id: "battery",
      component: (
        <BatteryVisualization 
          level={Math.round(progress * 100)} 
          isCharging={isSimulating}
          className="h-full min-h-0"
        />
      ),
    },
   
    {
      id: "skeleton",
      component: (
        <div className="h-full min-h-0 rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950/75 via-slate-900/50 to-slate-900/60 flex items-center justify-center shadow-[0_30px_70px_-44px_rgba(236,72,153,0.5)] backdrop-blur-2xl dark:border-white/10">
          <SmallSkeleton />
        </div>
      ),
    },
  ], [progress, isSimulating])

  return (
    <main className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-gradient-to-b from-brand-50 via-white to-brand-100 px-4 py-4 text-foreground transition-[background-color] duration-300 dark:from-background dark:via-background dark:to-background sm:px-6 xl:px-8 3xl:px-12 4xl:px-16">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex h-full w-full flex-col gap-6 2xl:gap-8 3xl:gap-10">
        <section className="w-full">
          <ProgressBar
            steps={progressSteps}
            currentStepIndex={currentStepIndex}
            progress={stepProgress}
            showDescriptions
            className="rounded-[28px]"
            ariaLabel="Charging session progress"
          />
        </section>

        <section className="grid flex-1 grid-cols-1 gap-6 xl:grid-cols-3 2xl:gap-8 3xl:gap-10">
          <DraggableGrid
            items={gridItems}
            className="grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-6 2xl:gap-8"
          />

          <EVCC
            status={evccStatus}
            chargingProgress={progress}
            onStart={startSimulation}
            onEnd={stopSimulation}
            onReset={resetSimulation}
            onInfoClick={handleActionInfoClick}
            className="rounded-[28px]"
          />
          
          <Terminal logs={[]} className="rounded-[28px]" />
        </section>
      </div>
    </main>
  )
}