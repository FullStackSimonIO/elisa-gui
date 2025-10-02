"use client"

import { useEffect, useMemo, useState } from "react"
import EVCC from "@/components/EVCC"
import ProgressBar from "@/components/ProgressBar"
import { Button } from "@/components/ui/button"

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

export default function Page() {
  const [progress, setProgress] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)

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

  const handleSimulationToggle = () => {
    if (isSimulating) {
      setIsSimulating(false)
      setProgress(0)
      return
    }

    setProgress(0)
    setIsSimulating(true)
  }

  const evccStatus = useMemo(
    () => (progress >= 1 ? "completed" : progress > 0 ? "charging" : "plugged-in"),
    [progress]
  )

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

  const simulationLabel = useMemo(() => {
    if (isSimulating) return "Stop simulation"
    if (progress >= 1) return "Restart simulation"
    return "Run charging simulation"
  }, [isSimulating, progress])

  const displayProgress = Math.round(progress * 100)

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-brand-50 via-white to-brand-100 px-4 text-foreground sm:px-6">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-12 pb-24 pt-20">
        <header className="flex w-full flex-col items-center gap-4 rounded-3xl border border-white/40 bg-white/70 p-8 text-center shadow-sm backdrop-blur">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-brand">
            EV Insights
          </span>
          <div className="flex w-full flex-col items-center gap-8">
            <div className="max-w-2xl space-y-3">
              <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                Your premium EV charging dashboard
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Monitor the full charging process and stay in control of every action. These widgets update in real time once connected to the vehicle backend.
              </p>
            </div>
            <div className="flex flex-col items-center gap-5">
              <dl className="grid grid-cols-2 gap-6 rounded-2xl bg-brand-50/80 px-5 py-4 text-sm text-brand-900 shadow-inner sm:text-base">
                <div className="text-center">
                  <dt className="text-xs uppercase tracking-wide text-brand-600">Active Modules</dt>
                  <dd className="text-2xl font-semibold text-brand">02</dd>
                </div>
                <div className="text-center">
                  <dt className="text-xs uppercase tracking-wide text-brand-600">Next Charging</dt>
                  <dd className="text-2xl font-semibold text-brand">04 Nov</dd>
                </div>
              </dl>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={handleSimulationToggle}
                  variant={isSimulating ? "secondary" : "default"}
                  className="shadow-sm"
                >
                  {simulationLabel}
                </Button>
                <span className="text-xs font-medium uppercase tracking-[0.3em] text-brand">
                  {displayProgress}%
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid w-full grid-cols-1 gap-8 2xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:gap-12">
          <div className="grid grid-cols-1 gap-8">
            <EVCC status={evccStatus} chargingProgress={progress} className="h-full" />
            {/* <ChargingAnimation progress={progress} isActive={isAnimationActive} className="h-full" /> */}
          </div>

          <ProgressBar
            steps={progressSteps}
            currentStepIndex={currentStepIndex}
            progress={stepProgress}
            showDescriptions
            className="h-full"
            ariaLabel="Charging session progress"
          />
        </div>
      </div>
    </main>
  )
}