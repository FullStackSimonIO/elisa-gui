"use client"

import * as React from "react"
import { Battery, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface BatteryVisualizationProps {
  level?: number // Battery level percentage (0-100)
  isCharging?: boolean
  className?: string
}

export function BatteryVisualization({
  level = 75,
  isCharging = false,
  className,
}: BatteryVisualizationProps) {
  const clamped = React.useMemo(() => Math.min(100, Math.max(0, level)), [level])
  
  // Determine color based on battery level
  const { fillColor, glowColor, statusText, statusColor } = React.useMemo(() => {
    if (isCharging) {
      return {
        fillColor: "from-brand-400 via-brand-500 to-brand-600",
        glowColor: "rgba(236, 72, 153, 0.4)",
        statusText: "Charging",
        statusColor: "text-brand",
      }
    }
    
    if (clamped >= 80) {
      return {
        fillColor: "from-emerald-400 via-emerald-500 to-emerald-600",
        glowColor: "rgba(52, 211, 153, 0.4)",
        statusText: "Full",
        statusColor: "text-emerald-400",
      }
    }
    
    if (clamped >= 50) {
      return {
        fillColor: "from-green-400 via-green-500 to-green-600",
        glowColor: "rgba(74, 222, 128, 0.4)",
        statusText: "Good",
        statusColor: "text-green-400",
      }
    }
    
    if (clamped >= 30) {
      return {
        fillColor: "from-yellow-400 via-yellow-500 to-yellow-600",
        glowColor: "rgba(250, 204, 21, 0.4)",
        statusText: "Medium",
        statusColor: "text-yellow-400",
      }
    }
    
    if (clamped >= 15) {
      return {
        fillColor: "from-orange-400 via-orange-500 to-orange-600",
        glowColor: "rgba(251, 146, 60, 0.4)",
        statusText: "Low",
        statusColor: "text-orange-400",
      }
    }
    
    return {
      fillColor: "from-red-400 via-red-500 to-red-600",
      glowColor: "rgba(248, 113, 113, 0.4)",
      statusText: "Critical",
      statusColor: "text-red-400",
    }
  }, [clamped, isCharging])

  return (
    <article
      className={cn(
        "relative isolate flex h-full min-h-0 flex-col items-center justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/75 via-slate-900/50 to-slate-900/60 px-4 py-4 shadow-[0_30px_70px_-44px_rgba(236,72,153,0.5)] backdrop-blur-2xl dark:border-white/10",
        className
      )}
      aria-label={`Battery level ${clamped}%${isCharging ? ", charging" : ""}`}
    >
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-20 top-1/4 h-48 w-48 rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute -left-16 bottom-1/3 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex shrink-0 flex-col items-center gap-1">
        <p className="text-3xl font-medium uppercase tracking-wider text-foreground">
          Battery Status
        </p>
        
        <span className={cn("text-lg font-semibold uppercase tracking-wider", statusColor)}>
          {statusText}
        </span>
      </header>

      {/* Battery Visualization */}
      <div className="relative z-10 flex flex-1 min-h-0 flex-col items-center justify-center gap-2">
        {/* Battery Terminal (top cap) */}
        <div className="h-2 w-12 shrink-0 rounded-t-xl bg-slate-700/80 shadow-md ring-1 ring-white/10" />

        {/* Battery Body */}
        <div className="relative flex h-full max-h-[180px] w-24 shrink flex-col justify-end overflow-hidden rounded-2xl border-[3px] border-slate-700/80 bg-slate-950/60 shadow-2xl ring-1 ring-white/10">
          {/* Battery Fill */}
          <div
            className={cn(
              "relative w-full bg-gradient-to-t transition-all duration-1000 ease-out",
              fillColor
            )}
            style={{
              height: `${clamped}%`,
              boxShadow: `0 0 30px ${glowColor}, inset 0 0 20px rgba(255, 255, 255, 0.2)`,
            }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            {/* Animated waves */}
            <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
          </div>

          {/* Charging indicator */}
          {isCharging && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="h-8 w-8 animate-pulse text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" fill="currentColor" />
            </div>
          )}

          {/* Grid lines for measurement */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-px w-full bg-slate-600/30" />
            ))}
          </div>
        </div>

        {/* Percentage markers */}
        <div className="flex w-full max-w-[6rem] shrink-0 items-center justify-between text-[0.6rem] text-slate-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Footer info */}
      {isCharging && (
        <footer className="relative z-10 flex shrink-0 items-center gap-2 rounded-full bg-brand/15 px-3 py-1.5 shadow-lg ring-1 ring-white/10">
          <Zap className="h-3 w-3 text-brand" />
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-brand">
            Charging...
          </span>
        </footer>
      )}
    </article>
  )
}

export default BatteryVisualization
