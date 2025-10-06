"use client"

import * as React from "react"
import {
  AlertTriangle,
  CheckCircle,
  Cpu,
  Loader2,
  Server,
  Shield,
  ShieldCheck,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "../ui/button"

export type CertificateStatus = "queued" | "transferring" | "verified" | "failed"

export interface CertificateDescriptor {
  id: string
  name: string
  issuedBy?: string
  size?: string
  fingerprint?: string
  status?: CertificateStatus
}

export interface CertificateTransferVisualizerProps {
  /** Indicates that the transfer workflow has started. */
  isActive?: boolean
  /** Normalised transfer progress between 0 and 1. */
  progress?: number
  /** Optional certificate bundle metadata to render. */
  certificates?: CertificateDescriptor[]
  /** When the transfer was initiated. */
  startedAt?: Date | string
  /** Estimated seconds remaining until completion. */
  estimatedSecondsRemaining?: number
  className?: string
}

const PIPELINE_STEPS: Array<{
  key: string
  label: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}> = [
  {
    key: "pki",
    label: "OEM PKI",
    description: "Signing bundle",
    icon: ShieldCheck,
  },
  {
    key: "gateway",
    label: "Gateway",
    description: "Encrypting session",
    icon: Server,
  },
  {
    key: "vehicle",
    label: "EVCC",
    description: "Installing certificates",
    icon: Cpu,
  },
]

const FALLBACK_CERTIFICATES: CertificateDescriptor[] = [
  {
    id: "root-ca",
    name: "Root CA",
    issuedBy: "OEM Root Authority",
    size: "2.1 KB",
    fingerprint: "35:7F:1C:9A",
  },
  {
    id: "intermediate-ca",
    name: "Intermediate CA",
    issuedBy: "OEM Trust Chain",
    size: "3.8 KB",
    fingerprint: "AB:49:7E:DD",
  },
  {
    id: "evcc-leaf",
    name: "EVCC Client Certificate",
    issuedBy: "OEM PKI",
    size: "1.5 KB",
    fingerprint: "9C:11:3B:FA",
  },
]

type OverallStatus = "Idle" | "Transferring" | "Completed" | "Failed"

const SIMULATION_DURATION_MS = 8000

export function CertificateTransferVisualizer(props: CertificateTransferVisualizerProps) {
  const {
    isActive: isActiveProp,
    progress: progressProp,
    certificates,
    startedAt: startedAtProp,
    estimatedSecondsRemaining: estimatedSecondsRemainingProp,
    className,
  } = props

  const [internalActive, setInternalActive] = React.useState(false)
  const [internalProgress, setInternalProgress] = React.useState(0)
  const [internalStartedAt, setInternalStartedAt] = React.useState<Date | undefined>()
  const [internalEta, setInternalEta] = React.useState<number | undefined>()
  const animationFrameRef = React.useRef<number | null>(null)

  const isActiveControlled = isActiveProp !== undefined
  const progressControlled = progressProp !== undefined
  const startedAtControlled = startedAtProp !== undefined
  const etaControlled = estimatedSecondsRemainingProp !== undefined
  const isExternallyControlled =
    isActiveControlled || progressControlled || startedAtControlled || etaControlled

  const effectiveIsActive = isActiveControlled ? Boolean(isActiveProp) : internalActive
  const effectiveProgress = progressControlled ? progressProp ?? 0 : internalProgress
  const effectiveStartedAt = startedAtControlled ? startedAtProp : internalStartedAt
  const effectiveEtaSeconds = etaControlled ? estimatedSecondsRemainingProp : internalEta

  React.useEffect(() => {
    if (isExternallyControlled) {
      return
    }

    if (!internalActive) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    const start = performance.now()
    const duration = SIMULATION_DURATION_MS

    const step = (timestamp: number) => {
      const elapsed = timestamp - start
      const ratio = Math.min(elapsed / duration, 1)

      setInternalProgress(ratio)
      setInternalEta(Math.max(0, Math.ceil((duration - elapsed) / 1000)))

      if (ratio >= 1) {
        animationFrameRef.current = null
        setInternalActive(false)
        setInternalEta(0)
        return
      }

      animationFrameRef.current = requestAnimationFrame(step)
    }

    animationFrameRef.current = requestAnimationFrame(step)

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [internalActive, isExternallyControlled])

  const handleStartTransfer = React.useCallback(() => {
    if (isExternallyControlled) return

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    setInternalProgress(0)
    setInternalStartedAt(new Date())
    setInternalEta(Math.ceil(SIMULATION_DURATION_MS / 1000))
    setInternalActive(true)
  }, [isExternallyControlled])

  const clampedProgress = React.useMemo(() => {
    const value =
      typeof effectiveProgress === "number" && Number.isFinite(effectiveProgress)
        ? effectiveProgress
        : 0
    return Math.min(Math.max(value, 0), 1)
  }, [effectiveProgress])

  const percentLabel = React.useMemo(
    () => `${Math.round(clampedProgress * 100)}%`,
    [clampedProgress]
  )

  const baseCertificates = React.useMemo(() => {
    if (certificates && certificates.length > 0) {
      return certificates
    }

    return FALLBACK_CERTIFICATES
  }, [certificates])

  const suppliedStatuses = React.useMemo(
    () => baseCertificates.some((item) => item.status !== undefined),
    [baseCertificates]
  )

  const derivedCertificates = React.useMemo(() => {
    if (suppliedStatuses) {
      return baseCertificates.map((cert) => ({
        ...cert,
        status: cert.status ?? "queued",
      }))
    }

    const total = baseCertificates.length || 1

    if (!effectiveIsActive) {
      return baseCertificates.map((cert) => ({ ...cert, status: "queued" as const }))
    }

    if (clampedProgress >= 1) {
      return baseCertificates.map((cert) => ({ ...cert, status: "verified" as const }))
    }

    const activeIndex = Math.min(Math.floor(clampedProgress * total), total - 1)

    return baseCertificates.map((cert, index) => {
      if (index < activeIndex) {
        return { ...cert, status: "verified" as const }
      }

      if (index === activeIndex) {
        return { ...cert, status: "transferring" as const }
      }

      return { ...cert, status: "queued" as const }
    })
  }, [baseCertificates, clampedProgress, effectiveIsActive, suppliedStatuses])

  const hasFailure = React.useMemo(
    () => derivedCertificates.some((cert) => cert.status === "failed"),
    [derivedCertificates]
  )

  const overallStatus: OverallStatus = React.useMemo(() => {
    if (hasFailure) return "Failed"
    if (clampedProgress >= 1) return "Completed"
    if (effectiveIsActive) return "Transferring"
    return "Idle"
  }, [clampedProgress, effectiveIsActive, hasFailure])

  const statusToneClass = React.useMemo(() => {
    switch (overallStatus) {
      case "Transferring":
        return "bg-gradient-to-r from-brand-300/40 via-brand-500/30 to-brand-400/40 text-brand"
      case "Completed":
        return "bg-gradient-to-r from-emerald-400/30 via-emerald-500/25 to-emerald-400/30 text-emerald-200"
      case "Failed":
        return "bg-gradient-to-r from-destructive/30 via-destructive/20 to-destructive/30 text-destructive"
      default:
        return "bg-white/10 text-muted-foreground"
    }
  }, [overallStatus])

  const statusLabel = React.useMemo(() => {
    switch (overallStatus) {
      case "Transferring":
        return "Transferring"
      case "Completed":
        return "Completed"
      case "Failed":
        return "Attention"
      default:
        return "Idle"
    }
  }, [overallStatus])

  const startLabel = React.useMemo(() => {
    if (!effectiveStartedAt) return "Not started"

    const date =
      typeof effectiveStartedAt === "string" ? new Date(effectiveStartedAt) : effectiveStartedAt

    if (Number.isNaN(date.getTime())) return "Not started"

    return date.toLocaleString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }, [effectiveStartedAt])

  const etaLabel = React.useMemo(() => {
    if (effectiveEtaSeconds === undefined || Number.isNaN(effectiveEtaSeconds)) {
      return effectiveIsActive ? "Calculating" : "—"
    }

    if (effectiveEtaSeconds <= 0) {
      return "00s"
    }

    const minutes = Math.floor(effectiveEtaSeconds / 60)
    const seconds = effectiveEtaSeconds % 60

    if (minutes <= 0) {
      return `${seconds.toString().padStart(2, "0")}s`
    }

    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`
  }, [effectiveEtaSeconds, effectiveIsActive])

  const buttonLabel = React.useMemo(() => {
    if (effectiveIsActive) return "Transferring..."
    if (clampedProgress >= 1) return "Restart Transfer"
    return "Start Transfer"
  }, [clampedProgress, effectiveIsActive])

  const isButtonDisabled = isExternallyControlled || effectiveIsActive

  return (
    <section
      className={cn(
        "certificate-transfer relative isolate overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-white/20 via-white/10 to-white/5 p-5 shadow-[0_50px_120px_-70px_rgba(227,55,106,0.45)] backdrop-blur-2xl",
        "dark:border-white/10 dark:from-slate-950/45 dark:via-slate-950/25 dark:to-slate-950/50",
        "before:absolute before:-left-36 before:-top-28 before:h-72 before:w-72 before:rounded-[32px] before:bg-brand-400/30 before:blur-[140px] before:content-['']",
        "after:pointer-events-none after:absolute after:-bottom-32 after:-right-24 after:h-80 after:w-80 after:bg-gradient-to-br after:from-brand-200/20 after:via-primary/15 after:to-brand-500/25 after:opacity-80 after:blur-[180px] after:content-['']",
        "before:[clip-path:polygon(12%_0%,100%_8%,88%_100%,0%_88%)] after:[clip-path:polygon(0%_18%,78%_0%,100%_62%,18%_100%)]",
        className
      )}
      data-active={effectiveIsActive}
      data-status={overallStatus.toLowerCase()}
      aria-live="polite"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Certificate Handling
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Certificate Transfer
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 text-foreground shadow-[0_12px_30px_-20px_rgba(227,55,106,0.4)] backdrop-blur-lg transition hover:border-brand-300/60 hover:bg-brand-300/15 dark:border-white/10 dark:bg-white/5"
            onClick={handleStartTransfer}
            disabled={isButtonDisabled}
            title={isExternallyControlled ? "Managed by parent state" : undefined}
          >
            {buttonLabel}
          </Button>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-1 text-xs font-medium backdrop-blur-lg dark:border-white/5 dark:bg-white/5",
            statusToneClass
          )}
        >
          {overallStatus === "Failed" ? (
            <AlertTriangle className="h-4 w-4" aria-hidden />
          ) : overallStatus === "Completed" ? (
            <CheckCircle className="h-4 w-4" aria-hidden />
          ) : overallStatus === "Transferring" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Shield className="h-4 w-4" aria-hidden />
          )}
          <span>{statusLabel}</span>
        </span>
      </header>

    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
  <div className="relative flex flex-col gap-5 overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/20 via-white/10 to-white/5 p-5 shadow-[0_32px_90px_-70px_rgba(227,55,106,0.35)] backdrop-blur-xl dark:border-white/10 dark:from-slate-950/45 dark:via-slate-950/30 dark:to-slate-950/55">
          <span className="pointer-events-none absolute inset-px rounded-[28px] border border-white/20 opacity-40 dark:border-white/10" />
      <div className="relative -mx-3 overflow-x-auto px-3 pb-1.5">
            <div className="flex min-w-[660px] items-stretch gap-4 md:min-w-0">
              {PIPELINE_STEPS.map((step, index) => {
                const Icon = step.icon
                const isLast = index === PIPELINE_STEPS.length - 1

                return (
                  <React.Fragment key={step.key}>
                    <div
                      className={cn(
                        "group relative flex min-w-[220px] flex-1 flex-col gap-2 overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-white/22 via-white/10 to-white/12 p-4 text-sm shadow-[0_25px_60px_-50px_rgba(227,55,106,0.35)] transition-all duration-500",
                        effectiveIsActive ? "shadow-glow" : "shadow-none"
                      )}
                    >
                      <span className="pointer-events-none absolute inset-px rounded-[20px] border border-white/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:border-white/10" />
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-brand-300/25 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      <div className="flex items-center justify-between">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] bg-gradient-to-br from-brand-100/70 via-brand-400/35 to-primary/45 text-brand shadow-[0_20px_50px_-45px_rgba(227,55,106,0.55)]">
                          <Icon className="h-[22px] w-[22px]" aria-hidden />
                        </span>
                        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {index + 1}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="text-base font-semibold text-foreground">{step.label}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>

                    {!isLast ? (
                      <div className="flex w-12 shrink-0 items-center justify-center">
                        <div className="certificate-transfer__line h-[2px] w-full rounded-full bg-white/20" />
                      </div>
                    ) : null}
                  </React.Fragment>
                )
              })}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-lg dark:border-white/10 dark:bg-white/5">
            <span className="pointer-events-none absolute inset-px rounded-[18px] border border-white/20 opacity-40 dark:border-white/10" />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <span>Transfer progress</span>
              <span className="text-sm font-semibold text-foreground">{percentLabel}</span>
            </div>
            <div className="mt-2.5 h-2 w-full rounded-full bg-white/20">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r from-brand-100 via-brand-400 to-brand-700 shadow-[0_18px_40px_-30px_rgba(227,55,106,0.45)] transition-[width] duration-500 ease-out",
                  effectiveIsActive ? "animate-[pulse_2.8s_ease-in-out_infinite]" : ""
                )}
                style={{ width: `${Math.max(clampedProgress * 100, effectiveIsActive ? 6 : 0)}%` }}
              />
            </div>
          </div>
        </div>

  <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/25 via-white/10 to-white/10 p-5 shadow-[0_30px_80px_-60px_rgba(227,55,106,0.4)] backdrop-blur-xl dark:border-white/10 dark:from-slate-950/45 dark:via-slate-950/30 dark:to-slate-950/55">
          <span className="pointer-events-none absolute inset-px rounded-[28px] border border-white/20 opacity-40 dark:border-white/10" />
          <header className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Certificate bundle</h3>
              <p className="text-sm text-muted-foreground">
                Each certificate moves through the pipeline once the transfer is active.
              </p>
            </div>
            <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur dark:border-white/10 dark:bg-white/5">
              {derivedCertificates.length} items
            </span>
          </header>

          <ul className="mt-4 space-y-3">
            {derivedCertificates.length === 0 ? (
              <li className="rounded-[24px] border border-dashed border-white/20 bg-white/10 px-4 py-4 text-sm text-muted-foreground backdrop-blur">
                No certificates detected. Provide bundle metadata to render items.
              </li>
            ) : (
              derivedCertificates.map((certificate) => {
                const status = certificate.status ?? "queued"
                const statusInfo: Record<CertificateStatus, { label: string; tone: string; icon: React.ReactNode }> = {
                  queued: {
                    label: "Queued",
                    tone: "bg-white/20 text-muted-foreground dark:bg-white/10",
                    icon: <Shield className="h-3.5 w-3.5" aria-hidden />,
                  },
                  transferring: {
                    label: "Transferring",
                    tone: "bg-gradient-to-r from-brand-300/40 via-brand-500/30 to-primary/40 text-brand",
                    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />,
                  },
                  verified: {
                    label: "Installed",
                    tone: "bg-gradient-to-r from-emerald-400/30 via-emerald-500/25 to-emerald-400/30 text-emerald-200",
                    icon: <CheckCircle className="h-3.5 w-3.5" aria-hidden />,
                  },
                  failed: {
                    label: "Failed",
                    tone: "bg-gradient-to-r from-destructive/30 via-destructive/20 to-destructive/30 text-destructive",
                    icon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden />,
                  },
                }

                return (
                  <li
                    key={certificate.id}
                    className={cn(
                      "flex items-start justify-between gap-4 overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-white/20 via-white/10 to-white/10 p-4 backdrop-blur-lg",
                      status === "transferring"
                        ? "shadow-[0_26px_60px_-50px_rgba(227,55,106,0.5)]"
                        : "shadow-[0_18px_45px_-45px_rgba(87,15,37,0.35)]"
                    )}
                  >
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-foreground">{certificate.name}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {certificate.issuedBy ? (
                          <span className="inline-flex items-center gap-1">
                            <Shield className="h-3 w-3" aria-hidden />
                            {certificate.issuedBy}
                          </span>
                        ) : null}
                        {certificate.size ? (
                          <span>{certificate.size}</span>
                        ) : null}
                        {certificate.fingerprint ? (
                          <span className="font-mono">SHA-1 {certificate.fingerprint}</span>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs font-medium backdrop-blur-lg dark:border-white/5",
                        statusInfo[status].tone
                      )}
                    >
                      {statusInfo[status].icon}
                      {statusInfo[status].label}
                    </span>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      </div>

  <footer className="mt-4 flex flex-wrap items-center gap-5 rounded-[26px] border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-muted-foreground backdrop-blur dark:border-white/5 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" aria-hidden />
          <span className="text-xs uppercase tracking-[0.2em]">Started</span>
          <span className="font-medium text-foreground">{startLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4" aria-hidden />
          <span className="text-xs uppercase tracking-[0.2em]">ETA</span>
          <span className="font-medium text-foreground">{etaLabel}</span>
        </div>
      </footer>

      <style jsx>{`
        :global(.certificate-transfer__line) {
          position: relative;
          overflow: hidden;
        }

        :global(.certificate-transfer__line::after) {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 172, 198, 0.14) 18%,
            rgba(227, 55, 106, 0.45) 42%,
            rgba(255, 255, 255, 0.85) 50%,
            rgba(227, 55, 106, 0.45) 58%,
            rgba(255, 172, 198, 0.14) 82%,
            rgba(255, 255, 255, 0) 100%
          );
        }

        :global(.certificate-transfer[data-active="true"] .certificate-transfer__line::after) {
          opacity: 1;
          animation: certificate-flow 2.6s ease-in-out infinite;
        }

        @keyframes certificate-flow {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  )
}

export default CertificateTransferVisualizer
