"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface ChargingAnimationProps {
  /** Provide a custom SVG/illustration for the vehicle. */
  car?: React.ReactNode
  /** Provide a custom SVG/illustration for the charger or station. */
  charger?: React.ReactNode
  /** Accessible label for the car graphic. */
  carLabel?: string
  /** Accessible label for the charger graphic. */
  chargerLabel?: string
  /**
   * Normalised connection progress between 0 and 1. Controls the distance between
   * the car and charger, the glow intensity, and the cable fill.
   */
  progress?: number
  /** Toggles the breathing/pulse animations that indicate an active charge. */
  isActive?: boolean
  className?: string
}

const DefaultCar = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  function DefaultCar(props, ref) {
    return (
      <svg
        ref={ref}
        viewBox="0 0 180 90"
        fill="none"
        role="img"
        aria-hidden
        {...props}
      >
        <rect
          x={12}
          y={28}
          width={132}
          height={38}
          rx={12}
          className="fill-brand-400/40 stroke-brand-700"
          strokeWidth={3}
        />
        <rect
          x={22}
          y={18}
          width={88}
          height={26}
          rx={8}
          className="fill-white/70 stroke-brand-500/80"
          strokeWidth={3}
        />
        <circle cx={48} cy={74} r={12} className="fill-brand-900/90" />
        <circle cx={48} cy={74} r={6} className="fill-brand-300" />
        <circle cx={126} cy={74} r={12} className="fill-brand-900/90" />
        <circle cx={126} cy={74} r={6} className="fill-brand-300" />
        <path
          d="M148 42h16"
          stroke="currentColor"
          strokeWidth={4}
          strokeLinecap="round"
          className="text-brand-500/70"
        />
      </svg>
    )
  }
)

const DefaultCharger = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  function DefaultCharger(props, ref) {
    return (
      <svg
        ref={ref}
        viewBox="0 0 90 180"
        fill="none"
        role="img"
        aria-hidden
        {...props}
      >
        <rect
          x={20}
          y={18}
          width={50}
          height={120}
          rx={18}
          className="fill-white/70 stroke-brand-600"
          strokeWidth={4}
        />
        <rect
          x={28}
          y={32}
          width={34}
          height={48}
          rx={10}
          className="fill-brand/30"
        />
        <circle cx={45} cy={104} r={9} className="fill-brand-600" />
        <rect x={38} y={134} width={14} height={32} rx={6} className="fill-brand-700" />
      </svg>
    )
  }
)

export function ChargingAnimation({
  car,
  charger,
  carLabel = "Vehicle",
  chargerLabel = "Charging station",
  progress = 0,
  isActive = false,
  className,
}: ChargingAnimationProps) {
  const clamped = React.useMemo(() => Math.min(Math.max(progress, 0), 1), [progress])
  const pathRef = React.useRef<SVGPathElement>(null)
  const [pathLength, setPathLength] = React.useState<number>(0)

  React.useEffect(() => {
    if (!pathRef.current) return
    const length = pathRef.current.getTotalLength()
    setPathLength(length)
  }, [])

  const carShift = React.useMemo(() => 90 * clamped, [clamped])
  const chargerShift = React.useMemo(() => -36 * clamped, [clamped])
  const glowAlpha = React.useMemo(() => 0.25 + clamped * 0.55, [clamped])
  const brightness = React.useMemo(() => 1 + clamped * 0.25, [clamped])
  const dashOffset = React.useMemo(
    () => (pathLength > 0 ? pathLength - pathLength * clamped : 0),
    [pathLength, clamped]
  )

  const cableGlowStyle = React.useMemo(
    () => ({
      strokeDasharray: pathLength,
      strokeDashoffset: dashOffset,
    }),
    [dashOffset, pathLength]
  )

  const sheenStyle = React.useMemo<React.CSSProperties | undefined>(() => {
    if (!(pathLength > 0)) return undefined
    return {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength,
      ["--dash" as const]: pathLength,
    } as React.CSSProperties
  }, [pathLength])

  return (
    <section
      className={cn(
        "charging-animation relative isolate overflow-hidden rounded-3xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur ",
        "before:pointer-events-none before:absolute before:-right-20 before:top-1/2 before:h-64 before:w-64 before:-translate-y-1/2 before:rounded-full before:bg-brand/15 before:blur-3xl before:content-['']",
        className
      )}
      data-active={isActive}
      aria-live="polite"
    >
      <div className="relative mx-auto flex h-64 w-full max-w-3xl items-end justify-between">
        <div className="absolute inset-x-0 bottom-16 top-0">
          <svg
            className="h-full w-full"
            viewBox="0 0 600 260"
            fill="none"
            role="presentation"
            style={{
              transition: "filter 0.6s ease, opacity 0.6s ease",
              filter: `drop-shadow(0 0 ${24 + clamped * 20}px rgba(227, 55, 106, ${glowAlpha * 0.6}))`,
              opacity: 0.7 + clamped * 0.3,
            }}
          >
            <defs>
              <linearGradient id="cableGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(227,55,106,0.2)" />
                <stop offset="50%" stopColor="rgba(227,55,106,0.75)" />
                <stop offset="100%" stopColor="rgba(255,165,199,0.4)" />
              </linearGradient>
            </defs>
            <path
              d="M120 220 C 240 210, 340 220, 480 200"
              stroke="rgba(255, 207, 224, 0.35)"
              strokeWidth={14}
              strokeLinecap="round"
            />
            <path
              ref={pathRef}
              d="M120 220 C 240 210, 340 220, 480 200"
              stroke="url(#cableGradient)"
              strokeWidth={10}
              strokeLinecap="round"
              style={cableGlowStyle}
            />
            {isActive && pathLength > 0 ? (
              <path
                d="M120 220 C 240 210, 340 220, 480 200"
                stroke="rgba(255,255,255,0.55)"
                strokeWidth={4}
                strokeLinecap="round"
                className="charging-cable-sheen"
                style={sheenStyle}
              />
            ) : null}
          </svg>
        </div>

        <div
          className="relative z-10 w-[160px] max-w-[36vw] transition-all duration-700 ease-out"
          style={{
            transform: `translateX(${carShift}px)`,
            filter: `brightness(${brightness}) drop-shadow(0 0 ${32 + clamped * 28}px rgba(227, 55, 106, ${glowAlpha}))`,
          }}
          aria-label={carLabel}
        >
          <div className="relative" style={{ animation: isActive && clamped > 0 ? "float-soft 5s ease-in-out infinite" : undefined }}>
            {car ?? <DefaultCar className="w-full" />}
            <div
              aria-hidden
              className="absolute inset-x-6 bottom-1 top-auto h-5 rounded-full bg-brand/30 blur-lg"
              style={{ opacity: 0.4 + clamped * 0.4 }}
            />
          </div>
        </div>

        <div
          className="relative z-10 w-[120px] max-w-[24vw] transition-all duration-700 ease-out"
          style={{
            transform: `translateX(${chargerShift}px)`,
            filter: `brightness(${1 + clamped * 0.18}) drop-shadow(0 0 ${24 + clamped * 22}px rgba(227, 55, 106, ${glowAlpha * 0.9}))`,
          }}
          aria-label={chargerLabel}
        >
          <div className="relative" style={{ animation: isActive && clamped > 0 ? "float-soft 6s ease-in-out infinite" : undefined }}>
            {charger ?? <DefaultCharger className="w-full" />}
            <div
              aria-hidden
              className="absolute inset-x-3 bottom-1 top-auto h-4 rounded-full bg-brand/30 blur-[22px]"
              style={{ opacity: 0.35 + clamped * 0.35 }}
            />
          </div>
        </div>
      </div>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        
        <span className="text-xs uppercase tracking-[0.3em] text-brand">
          {(clamped * 100).toFixed(0)}%
        </span>
      </footer>

      <style jsx>{`
        :global(.charging-animation[data-active="true"] .charging-cable-sheen) {
          animation: cable-sheen 2.8s ease-in-out infinite;
        }

        :global(@keyframes cable-sheen) {
          0% {
            stroke-dashoffset: var(--dash, 1000);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }

        :global(@keyframes float-soft) {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </section>
  )
}

export default ChargingAnimation