"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import EVCC, { type EVCCProps } from "@/components/EVCC"
import ProgressBar, { CHARGING_PROGRESS_STEPS } from "@/components/ProgressBar"
import Terminal, { type TerminalLogEntry, type TerminalLogStatus } from "@/components/Terminal"
import ChargingAnimation from "@/components/ChargingAnimation"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

const progressSteps = CHARGING_PROGRESS_STEPS

type EVCCInfoClickPayload = Parameters<NonNullable<EVCCProps["onInfoClick"]>>[0]

export default function Page() {
  const [progress, setProgress] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogEntry[]>([])
  const completedStepRef = useRef(-1)

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
    completedStepRef.current = -1
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
    completedStepRef.current = -1
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

  useEffect(() => {
    setTerminalLogs((prev) => {
      if (!isSimulating && progress === 0) {
        completedStepRef.current = -1
        return []
      }

      const nextLogs = [...prev]
      const targetCompletedIndex =
        progress >= 1
          ? progressSteps.length - 1
          : Math.max(-1, currentStepIndex - 1)

      if (targetCompletedIndex <= completedStepRef.current) {
        return prev
      }

      for (
        let index = completedStepRef.current + 1;
        index <= targetCompletedIndex;
        index += 1
      ) {
        const step = progressSteps[index]
        if (!step) continue

        const timestamp = new Date()

        const label =
          step.terminalLabel ??
          [step.title, step.description].filter(Boolean).join(" - ")

        const detail =
          step.description &&
          label.toLowerCase().includes(step.description.toLowerCase())
            ? undefined
            : step.description

        nextLogs.push({
          id: `${step.id}-completed-${timestamp.getTime()}`,
          label,
          detail,
          status: "success",
          timestamp: timestamp.toISOString(),
          meta: "DONE",
        })
      }

      completedStepRef.current = targetCompletedIndex

      return nextLogs
    })
  }, [currentStepIndex, isSimulating, progress])

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
    <main className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-gradient-to-b from-brand-50 via-white to-brand-100 px-4 py-4 text-foreground transition-[background-color] duration-300 dark:from-background dark:via-background dark:to-background sm:px-6 xl:px-8 3xl:px-12 4xl:px-16">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400/10 blur-[120px]" />
      </div>

  <div className="relative z-10 flex h-full w-full flex-col gap-6 2xl:gap-8 3xl:gap-10">
        <ResizablePanelGroup direction="vertical" className="flex-1 gap-5 xl:gap-6 3xl:gap-10">
          <ResizablePanel defaultSize={55} minSize={40} className="flex">
            <ResizablePanelGroup direction="horizontal" className="h-full flex-1 gap-5 xl:gap-6 3xl:gap-10">
              <ResizablePanel minSize={20} defaultSize={32} className="flex min-h-0 flex-col">
                <ProgressBar
                  steps={progressSteps}
                  currentStepIndex={currentStepIndex}
                  progress={stepProgress}
                  showDescriptions
                  className="flex-1"
                  ariaLabel="Charging session progress"
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel minSize={20} defaultSize={68} className="flex min-h-0 flex-col">
                <ChargingAnimation
                  progress={progress}
                  isActive={isSimulating && progress > 0}
                  className="flex-1 min-h-[320px]"
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={45} minSize={35} className="flex">
            <ResizablePanelGroup direction="horizontal" className="h-full flex-1 gap-5 xl:gap-6 3xl:gap-10">
              <ResizablePanel minSize={20} defaultSize={45} className="flex min-h-0 flex-col">
                <EVCC
                  status={evccStatus}
                  chargingProgress={progress}
                  onStart={startSimulation}
                  onEnd={stopSimulation}
                  onReset={resetSimulation}
                  onInfoClick={handleActionInfoClick}
                  className="flex-1"
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel minSize={20} defaultSize={55} className="flex min-h-0 flex-col">
                <Terminal
                  logs={terminalLogs}
                  className="flex-1 min-h-[220px] 3xl:min-h-[460px]"
                  footerNote="Terminal Output"
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  )
}