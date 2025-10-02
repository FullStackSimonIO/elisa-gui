"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import ChargingAnimation from "@/components/ChargingAnimation"
import EVCC, { type EVCCProps } from "@/components/EVCC"
import ProgressBar from "@/components/ProgressBar"
import Terminal, { type TerminalLogEntry, type TerminalLogStatus } from "@/components/Terminal"
import { ThemeToggle } from "@/components/theme-toggle"
import Navbar from "@/components/Navbar"

const progressSteps = [
  { id: "handshake", title: "Handshake", description: "Vehicle requests session" },
  { id: "authorization", title: "Authorization", description: "Driver profile verified" },
  { id: "connector-lock", title: "Connector Lock", description: "Plug secured" },
  { id: "precharge", title: "Pre-Charge", description: "Voltage aligned" },
  { id: "ramp-up", title: "Ramp Up", description: "Current increases" },
  { id: "steady", title: "Steady State", description: "Charging at target rate" },
  { id: "thermal-check", title: "Thermal Check", description: "Cooling system validation" },
  { id: "taper", title: "Taper", description: "Current reduces near full" },
  { id: "top-off", title: "Top Off", description: "Balancing individual cells" },
  { id: "complete", title: "Complete", description: "Ready to disconnect" },
]

type EVCCInfoClickPayload = Parameters<NonNullable<EVCCProps["onInfoClick"]>>[0]

export default function Page() {
  const [progress, setProgress] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogEntry[]>([])
  const processedStepRef = useRef(-1)

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
    processedStepRef.current = -1
    setTerminalLogs(() => [])
    setProgress(0)
    setIsSimulating(true)
  }, [])

  const stopSimulation = useCallback(() => {
    setIsSimulating(false)
  }, [])

  const resetSimulation = useCallback(() => {
    setIsSimulating(false)
    setProgress(0)
    processedStepRef.current = -1
    setTerminalLogs(() => [])
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

  const isAnimationActive = isSimulating

  useEffect(() => {
    setTerminalLogs((prev) => {
      if (!isSimulating && progress === 0) {
        processedStepRef.current = -1
        return []
      }

      const nextLogs = [...prev]

      if (
        (isSimulating || progress > 0) &&
        currentStepIndex > processedStepRef.current
      ) {
        for (let i = 0; i <= processedStepRef.current; i += 1) {
          if (nextLogs[i] && nextLogs[i].status !== "success") {
            nextLogs[i] = { ...nextLogs[i], status: "success" }
          }
        }

        const step = progressSteps[currentStepIndex]
        processedStepRef.current = currentStepIndex

        nextLogs.push({
          id: `${step.id}-${Date.now()}`,
          label: `${currentStepIndex + 1}. ${step.title}`,
          detail: step.description,
          status:
            progress >= 1 && currentStepIndex === progressSteps.length - 1
              ? "success" as TerminalLogStatus
              : "running" as TerminalLogStatus,
          timestamp: new Date().toISOString(),
        })

        return nextLogs
      }

      let changed = false
      const updated = nextLogs.map((log, index) => {
        let desiredStatus: TerminalLogEntry["status"] = log.status

        if (index < currentStepIndex) {
          desiredStatus = "success" as TerminalLogStatus
        } else if (index === currentStepIndex) {
          desiredStatus =
            progress >= 1 && currentStepIndex === progressSteps.length - 1
              ? "success" as TerminalLogStatus
              : isAnimationActive
                ? "running" as TerminalLogStatus
                : "pending" as TerminalLogStatus
        }

        if (desiredStatus !== log.status) {
          changed = true
          return { ...log, status: desiredStatus }
        }

        return log
      })

      return changed ? updated : prev
    })
  }, [currentStepIndex, isAnimationActive, isSimulating, progress])

  useEffect(() => {
    if (progress < 1) return

    setTerminalLogs((prev) => {
      const normalized = prev.map((log) =>
        log.status !== "success" ? { ...log, status: "success" as TerminalLogStatus } : log
      )

      if (normalized.some((log) => log.id === "session-complete")) {
        return normalized
      }

      return [
        ...normalized,
        {
          id: "session-complete",
          label: "Session complete",
          detail: "Vehicle confirmed full charge. Connector ready to release.",
          status: "success" as TerminalLogStatus,
          timestamp: new Date().toISOString(),
          meta: "OK",
        },
      ]
    })
  }, [progress])

  return (
    <main className="relative flex flex-row min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-b from-brand-50 via-white to-brand-100 px-4 text-foreground transition-[background-color] duration-300 dark:from-background dark:via-background dark:to-background sm:px-6">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400/10 blur-[120px]" />
      </div>

      

      <div className="relative z-10 mx-auto flex w-full  flex-col items-center gap-12 pb-24 pt-20">
        

        <ProgressBar
              steps={progressSteps}
              currentStepIndex={currentStepIndex}
              progress={stepProgress}
              showDescriptions
              className="h-full w-full"
              ariaLabel="Charging session progress"
            />

        <div className="grid w-full grid-cols-1 gap-8 2xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:gap-12">
          <div className="grid grid-cols-1 gap-8">
            <EVCC
              status={evccStatus}
              chargingProgress={progress}
              onStart={startSimulation}
              onEnd={stopSimulation}
              onReset={resetSimulation}
              onInfoClick={handleActionInfoClick}
              className="h-full"
            />
            {/* <ChargingAnimation progress={progress} isActive={isAnimationActive} className="h-full" /> */}
          </div>

          <div className="grid grid-cols-1 gap-8">
            
            <Terminal
              logs={terminalLogs}
              className="min-h-[320px]"
              footerNote="Terminal Output"
            />
          </div>
        </div>
      </div>
    </main>
  )
}