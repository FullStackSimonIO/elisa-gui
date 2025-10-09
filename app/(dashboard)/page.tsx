"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import EVCC, { type EVCCProps } from "@/components/EVCC"
import ProgressBar, { CHARGING_PROGRESS_STEPS } from "@/components/ProgressBar"
import ClockCard from "@/components/ClockCard"
import Terminal, { type TerminalLogEntry } from "@/components/Terminal"
import BatteryVisualization from "@/components/BatteryVisualization"
import SmallSkeleton from "@/components/Skeleton/SmallSkeleton"
import { DraggableGrid, type GridItem } from "@/components/DraggableGrid"
import WeatherCard from "@/components/WeatherCard"

const progressSteps = CHARGING_PROGRESS_STEPS

type EVCCInfoClickPayload = Parameters<NonNullable<EVCCProps["onInfoClick"]>>[0]

export default function Page() {
  const [progress, setProgress] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isChargingStarted, setIsChargingStarted] = useState(false)
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogEntry[]>([])

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
    setIsChargingStarted(false)
    setTerminalLogs([])
    
    // Add initial log
    setTerminalLogs([{
      id: "1",
      label: "Initializing charging session",
      status: "running",
      timestamp: new Date().toISOString(),
    }])

    // Complete initialization
    setTimeout(() => {
      setTerminalLogs(prev => prev.map(log => 
        log.id === "1" ? { ...log, status: "success" as const } : log
      ))
    }, 500)

    // Simulate terminal logs
    setTimeout(() => {
      setTerminalLogs(prev => [...prev, {
        id: "2",
        label: "Vehicle connected",
        status: "success",
        timestamp: new Date().toISOString(),
      }])
    }, 1000)

    setTimeout(() => {
      setTerminalLogs(prev => [...prev, {
        id: "3",
        label: "Authentication successful",
        status: "success",
        timestamp: new Date().toISOString(),
      }])
    }, 2000)

    setTimeout(() => {
      setTerminalLogs(prev => [...prev, {
        id: "4",
        label: "Power delivery negotiated",
        status: "success",
        timestamp: new Date().toISOString(),
      }])
    }, 3000)

    setTimeout(() => {
      setTerminalLogs(prev => [...prev, {
        id: "5",
        label: "Charging started",
        status: "running",
        timestamp: new Date().toISOString(),
      }])
    }, 4000)

    // Complete charging started - THIS TRIGGERS THE ACTUAL CHARGING
    setTimeout(() => {
      setTerminalLogs(prev => prev.map(log => 
        log.id === "5" ? { ...log, status: "success" as const } : log
      ))
      // Only NOW start the actual charging progress
      setIsChargingStarted(true)
    }, 4500)
  }, [])

  const stopSimulation = useCallback(() => {
    setIsSimulating(false)
    setIsChargingStarted(false)
    setTerminalLogs(prev => [...prev, {
      id: `${prev.length + 1}`,
      label: "Charging stopped by user",
      status: "success",
      timestamp: new Date().toISOString(),
    }])
  }, [])

  const resetSimulation = useCallback(() => {
    setIsSimulating(false)
    setIsChargingStarted(false)
    setProgress(0)
    setTerminalLogs([{
      id: "reset",
      label: "Session reset",
      status: "success",
      timestamp: new Date().toISOString(),
    }])
  }, [])

  // Only increment progress when charging has actually started (after backend confirms)
  useEffect(() => {
    if (!isSimulating || !isChargingStarted) return
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) return 1
        const next = Math.min(prev + 0.01, 1)
        return next
      })
    }, 60)

    return () => window.clearInterval(interval)
  }, [isSimulating, isChargingStarted])

  useEffect(() => {
    if (progress >= 1 && isSimulating && isChargingStarted) {
      setIsSimulating(false)
      setIsChargingStarted(false)
      setTerminalLogs(prev => [...prev, {
        id: `${prev.length + 1}`,
        label: "Charging completed",
        status: "success",
        timestamp: new Date().toISOString(),
      }])
    }
  }, [progress, isSimulating, isChargingStarted])

  const evccStatus = useMemo(() => {
    if (progress >= 1) return "completed" as const
    // Only show "charging" when backend has confirmed charging started
    if (isSimulating && isChargingStarted && progress > 0) return "charging"
    // Show "ready-to-charge" when simulation started but charging not yet confirmed
    if (isSimulating) return "ready-to-charge"
    if (progress > 0) return "ready-to-charge"
    return "plugged-in"
  }, [isSimulating, isChargingStarted, progress])

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
          isCharging={isSimulating && isChargingStarted}
          className="h-full min-h-0"
        />
      ),
    },
   
    {
      id: "skeleton",
      component: (
        <div className="h-full min-h-0 rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 flex items-center justify-center shadow-lg dark:border-white/10">
          <SmallSkeleton />
        </div>
      ),
    },
    {
      id: "weather",
      component: (
        <WeatherCard 
          condition="sunny"
          temperature={22}
          location="Berlin"
          humidity={65}
          windSpeed={12}
          className="h-full min-h-0"
        />
      ),
    },
  ], [progress, isSimulating, isChargingStarted])

  return (
    <main className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-gradient-to-b from-brand-50 via-white to-brand-100 px-6 py-6 text-foreground dark:from-background dark:via-background dark:to-background sm:px-8 xl:px-10 2xl:px-12 3xl:px-16">
      {/* Removed expensive blur backgrounds for better performance on Raspberry Pi */}
      
      {/* Optimized for 3840x1100 ultra-wide display - added vertical padding and spacing */}
      <div className="relative z-10 flex h-full w-full max-w-[3800px] mx-auto flex-col gap-8 py-2 2xl:gap-10 3xl:gap-12">
        <section className="w-full shrink-0">
          <ProgressBar
            steps={progressSteps}
            currentStepIndex={currentStepIndex}
            progress={stepProgress}
            showDescriptions
            className="rounded-[28px]"
            ariaLabel="Charging session progress"
          />
        </section>

        <section className="grid flex-1 min-h-0 grid-cols-1 gap-8 xl:grid-cols-3 2xl:gap-10 3xl:gap-12">
          <DraggableGrid
            items={gridItems}
            className="grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-8 2xl:gap-10"
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
          
          <Terminal logs={terminalLogs} className="rounded-[28px]" />
        </section>
      </div>
    </main>
  )
}