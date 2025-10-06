"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import {
  CertificateActionDescriptor,
  CertificateActionKey,
  CertificateTransferControls,
} from "@/components/certificates/CertificateTransferControls"
import {
  CertificateDescriptor,
  CertificateStatus,
  CertificateTransferVisualizer,
  FALLBACK_CERTIFICATES,
} from "@/components/certificates/CertificateTransferVisualizer"
import {
  Terminal,
  TerminalLogEntry,
  TerminalLogStatus,
} from "@/components/Terminal"
type CertificateStep = {
  id: string
  label: string
  description: string
  meta?: string
}

const SIMULATION_DURATION_MS = 8000

const ACTION_LABELS: Record<CertificateActionKey, string> = {
  "pre-install": "Pre-install certificates",
  distribute: "Distribute certificates",
  reset: "Reset certificates",
}

const TERMINAL_PROMPTS: Record<CertificateActionKey | "standby", string> = {
  standby: "evcc@controller",
  "pre-install": "evcc@preinstall",
  distribute: "evcc@mesh",
  reset: "evcc@reset",
}

const CERTIFICATE_STEPS: Record<CertificateActionKey | "default", CertificateStep[]> = {
  "pre-install": [
    {
      id: "stage",
      label: "Staging certificate bundle",
      description: "Preparing OEM payload for secure channel",
      meta: "STEP 01",
    },
    {
      id: "validate",
      label: "Validating OEM manifest",
      description: "Checking bundle signatures against OEM PKI",
      meta: "STEP 02",
    },
    {
      id: "upload",
      label: "Uploading certificate package",
      description: "Streaming PEM artifacts to controller storage",
      meta: "STEP 03",
    },
    {
      id: "attestation",
      label: "Attesting hardware secure module",
      description: "Verifying TPM nonce and key material",
      meta: "STEP 04",
    },
  ],
  distribute: [
    {
      id: "mesh-scan",
      label: "Scanning EVCC mesh",
      description: "Enumerating target modules for distribution",
      meta: "STEP 01",
    },
    {
      id: "push",
      label: "Pushing bundle to nodes",
      description: "Replicating credentials with delta compression",
      meta: "STEP 02",
    },
    {
      id: "integrity",
      label: "Integrity verification",
      description: "Cross-checking fingerprints across EVCC devices",
      meta: "STEP 03",
    },
    {
      id: "handover",
      label: "Issuing activation",
      description: "Restarting trust daemons with refreshed secrets",
      meta: "STEP 04",
    },
  ],
  reset: [
    {
      id: "drain",
      label: "Draining active sessions",
      description: "Gracefully closing certificate consumers",
      meta: "STEP 01",
    },
    {
      id: "revoke",
      label: "Revoking bundle",
      description: "Revoking serials from controller trust store",
      meta: "STEP 02",
    },
    {
      id: "wipe",
      label: "Wiping secure storage",
      description: "Shredding persisted keys and cache entries",
      meta: "STEP 03",
    },
    {
      id: "baseline",
      label: "Restoring factory anchors",
      description: "Reloading OEM baseline certificate set",
      meta: "STEP 04",
    },
  ],
  default: [],
}

const COMPLETION_MESSAGES: Record<
  CertificateActionKey | "default",
  {
    label: string
    detail: string
    meta?: string
  }
> = {
  "pre-install": {
    label: "OEM bundle staged successfully",
    detail: "EVCC controller confirmed trust chain installation.",
    meta: "DONE",
  },
  distribute: {
    label: "Distribution completed",
    detail: "All EVCC modules report synchronized certificates.",
    meta: "SYNC",
  },
  reset: {
    label: "Certificate store reset",
    detail: "Device restored to OEM baseline anchor set.",
    meta: "RESET",
  },
  default: {
    label: "Workflow complete",
    detail: "All certificate operations finished without issues.",
    meta: "DONE",
  },
}

const PROGRESS_MILESTONES = [
  { threshold: 0.05, meta: "HANDSHAKE" as const },
  { threshold: 0.2, meta: "MANIFEST" as const },
  { threshold: 0.4, meta: "TRANSFER" as const },
  { threshold: 0.6, meta: "VERIFY" as const },
  { threshold: 0.8, meta: "ATTEST" as const },
  { threshold: 0.95, meta: "FINAL" as const },
]

type MilestoneMeta = (typeof PROGRESS_MILESTONES)[number]["meta"]

const PROGRESS_MILESTONE_META: ReadonlySet<MilestoneMeta> = new Set(
  PROGRESS_MILESTONES.map((milestone) => milestone.meta)
)

interface MilestoneContext {
  actionKey: CertificateActionKey
  bundle: CertificateDescriptor[]
  token: number
}

function deterministicNumber(seed: number, salt: number, min: number, max: number) {
  if (max <= min) return min
  const raw = Math.sin(seed * (salt + 1)) * 10000
  const fractional = Math.abs(raw - Math.floor(raw))
  return Math.round(min + fractional * (max - min))
}

function deterministicHex(seed: number, salt: number, length: number) {
  const raw = Math.sin(seed * (salt + 3)) * 10 ** 8
  const hex = Math.abs(Math.floor(raw)).toString(16).toUpperCase()
  if (hex.length >= length) {
    return hex.slice(0, length)
  }
  return hex.padEnd(length, "0")
}

function buildMilestoneLogEntry(index: number, ctx: MilestoneContext) {
  const milestone = PROGRESS_MILESTONES[index]
  const actionLabel = ACTION_LABELS[ctx.actionKey]
  const list = ctx.bundle.map((item) => item.name).join(", ") || "No artifacts"

  switch (milestone.meta) {
    case "HANDSHAKE": {
      const latency = deterministicNumber(ctx.token, index, 82, 190)
      return {
        label: "Secure channel established",
        detail: `${actionLabel} handshake completed in ${latency}ms • cipher TLS1.3/ECDHE-AES256`,
        meta: milestone.meta,
      }
    }
    case "MANIFEST": {
      const digest = deterministicHex(ctx.token, index, 8)
      return {
        label: "Bundle manifest queued",
        detail: `${ctx.bundle.length} artifacts detected [${list}] • manifest digest ${digest}`,
        meta: milestone.meta,
      }
    }
    case "TRANSFER": {
      const current = ctx.bundle[ctx.token % ctx.bundle.length] ?? ctx.bundle[0]
      return {
        label: "Streaming certificate payloads",
        detail: `${current?.name ?? "Certificate"} ${current?.size ? `(${current.size})` : ""} transferred to EVCC store`,
        meta: milestone.meta,
      }
    }
    case "VERIFY": {
      const fingerprint = ctx.bundle[0]?.fingerprint ?? "—"
      return {
        label: "Integrity verification",
        detail: `SHA-1 ${fingerprint} validated across ${deterministicNumber(ctx.token, index, 3, 7)} nodes`,
        meta: milestone.meta,
      }
    }
    case "ATTEST": {
      const nonce = deterministicHex(ctx.token, index, 6)
      return {
        label: "Hardware attestation",
        detail: `TPM nonce ${nonce} acknowledged • HSM slot ${deterministicNumber(ctx.token, index, 2, 6)}`,
        meta: milestone.meta,
      }
    }
    case "FINAL":
    default: {
      return {
        label: "Finalizing trust anchors",
        detail: `Trust store refresh propagated in ${deterministicNumber(ctx.token, index, 210, 480)}ms`,
        meta: milestone.meta,
      }
    }
  }
}

const CERT_STATUS_LOG_META: Record<Exclude<CertificateStatus, "queued">, {
  meta: string
  status: TerminalLogStatus
  build: (cert: CertificateDescriptor, token: number) => { label: string; detail: string }
}> = {
  transferring: {
    meta: "TRANSFER",
    status: "running",
    build: (cert, token) => ({
      label: `Deploying · ${cert.name}`,
      detail: `Streaming ${cert.size ?? "unknown size"} from ${cert.issuedBy ?? "OEM"} • chunk ${deterministicNumber(token, cert.id.length, 3, 7)}/7`,
    }),
  },
  verified: {
    meta: "INSTALLED",
    status: "success",
    build: (cert) => ({
      label: `Installed · ${cert.name}`,
      detail: `Fingerprint ${cert.fingerprint ?? "n/a"} committed to secure store`,
    }),
  },
  failed: {
    meta: "ERROR",
    status: "error",
    build: (cert, token) => ({
      label: `Failed · ${cert.name}`,
      detail: `Controller returned code 0x${deterministicHex(token, cert.id.length, 4)} during replication`,
    }),
  },
}

const INITIAL_LOGS: TerminalLogEntry[] = []

const CertificatesPage = () => {
  const [activeAction, setActiveAction] = useState<CertificateActionKey | null>(null)
  const [currentSteps, setCurrentSteps] = useState<CertificateStep[]>(CERTIFICATE_STEPS.default)
  const [logs, setLogs] = useState<TerminalLogEntry[]>(INITIAL_LOGS)
  const [isActive, setIsActive] = useState(false)
  const [progress, setProgress] = useState(0)
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [etaSeconds, setEtaSeconds] = useState<number | undefined>()
  const [simulationToken, setSimulationToken] = useState<number>(0)

  const animationFrameRef = useRef<number | null>(null)
  const completionLogged = useRef(false)
  const stepLogIndexRef = useRef<Map<string, number>>(new Map())
  const emittedMilestonesRef = useRef<Set<string>>(new Set())
  const certificateStatusLogRef = useRef<Record<string, CertificateStatus | undefined>>({})
  const simulationTokenRef = useRef(0)
  const startLogIdRef = useRef<string | null>(null)

  const certificateBundle = useMemo(() => FALLBACK_CERTIFICATES, [])

  const pushLog = useCallback((entry: TerminalLogEntry) => {
    setLogs((prev) => [...prev, entry])
  }, [])

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  const buildStepLogs = useCallback(
    (key: CertificateActionKey, steps: CertificateStep[]): TerminalLogEntry[] => {
      const now = Date.now()
      return steps.map((step, index) => ({
        id: `${key}-${step.id}-${now}-${index}`,
        label: step.label,
        detail: step.description,
        meta: step.meta,
        status: index === 0 ? ("running" as TerminalLogStatus) : "pending",
        timestamp: new Date(now + index * 120).toISOString(),
      }))
    },
    []
  )

  const handleInfo = useCallback((descriptor: CertificateActionDescriptor) => {
    toast(descriptor.label, {
      description: descriptor.description,
      duration: 4200,
    })
  }, [])

  const handleAction = useCallback(
    (key: CertificateActionKey) => {
      stopAnimation()
      const steps = CERTIFICATE_STEPS[key] ?? CERTIFICATE_STEPS.default
      const initialLogs = buildStepLogs(key, steps)
      const started = new Date()
      const startedMs = started.getTime()

      stepLogIndexRef.current = new Map(initialLogs.map((log, index) => [log.id, index]))
      emittedMilestonesRef.current.clear()
      certificateStatusLogRef.current = {}
      simulationTokenRef.current = startedMs

      const headerLog: TerminalLogEntry = {
        id: `${key}-init-${startedMs}`,
        label: `${ACTION_LABELS[key]} initiated`,
        detail: `${steps.length} workflow stages queued • ${certificateBundle.length} certificate artifacts`,
        status: "running",
        timestamp: started.toISOString(),
        meta: "START",
      }

      setActiveAction(key)
      setCurrentSteps(steps)
      completionLogged.current = false
      setProgress(0)
      setStartedAt(started)
      setEtaSeconds(Math.ceil(SIMULATION_DURATION_MS / 1000))
      startLogIdRef.current = headerLog.id
      setLogs([headerLog, ...initialLogs])
      setSimulationToken(startedMs)
      setIsActive(true)
    },
    [buildStepLogs, certificateBundle, stopAnimation]
  )

  useEffect(() => {
    if (!isActive) {
      return () => stopAnimation()
    }

    const start = performance.now()
    const duration = SIMULATION_DURATION_MS

    const tick = (timestamp: number) => {
      const elapsed = timestamp - start
      const ratio = Math.min(elapsed / duration, 1)
      setProgress(ratio)
      setEtaSeconds(Math.max(0, Math.ceil((duration - elapsed) / 1000)))

      if (ratio >= 1) {
        animationFrameRef.current = null
        setIsActive(false)
        setEtaSeconds(0)
        return
      }

      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)

    return () => {
      stopAnimation()
    }
  }, [isActive, simulationToken, stopAnimation])

  useEffect(() => {
    if (currentSteps.length === 0) return

    const stepCount = currentSteps.length
    const scaled = progress * stepCount
    let activeIndex = Math.floor(scaled)
    if (activeIndex >= stepCount) activeIndex = stepCount - 1

    setLogs((prev) => {
      if (prev.length === 0) return prev

      const stepIndexMap = stepLogIndexRef.current
      if (stepIndexMap.size === 0) return prev

      let changed = false

      const next = prev.map((log) => {
        const stepIndex = stepIndexMap.get(log.id)
        if (stepIndex === undefined || stepIndex >= stepCount) {
          return log
        }

        let nextStatus: TerminalLogStatus

        if (progress >= 1) {
          nextStatus = "success"
        } else if (stepIndex < activeIndex) {
          nextStatus = "success"
        } else if (stepIndex === activeIndex) {
          nextStatus = isActive ? (progress > 0 ? "running" : "pending") : progress > 0 ? "success" : "pending"
        } else {
          nextStatus = "pending"
        }

        if (log.status === nextStatus) {
          return log
        }

        changed = true
        return {
          ...log,
          status: nextStatus,
          timestamp: new Date().toISOString(),
        }
      })

      return changed ? next : prev
    })
  }, [currentSteps, isActive, progress])

  useEffect(() => {
    if (!activeAction) return

    const token = simulationTokenRef.current
    const bundle = certificateBundle

    const transferLogIdsToFinalize: string[] = []

    PROGRESS_MILESTONES.forEach((milestone, index) => {
      if (progress < milestone.threshold) return
      const milestoneKey = `${token}-${milestone.meta}`
      if (emittedMilestonesRef.current.has(milestoneKey)) return

      emittedMilestonesRef.current.add(milestoneKey)
      const payload = buildMilestoneLogEntry(index, {
        actionKey: activeAction,
        bundle,
        token,
      })

      pushLog({
        id: `${activeAction}-milestone-${milestone.meta}-${token}`,
        label: payload.label,
        detail: payload.detail,
        status: index + 1 < PROGRESS_MILESTONES.length ? "running" : progress >= 1 ? "success" : "running",
        timestamp: new Date().toISOString(),
        meta: payload.meta,
      })
    })

    const total = bundle.length || 1
    const activeCertificateIndex = Math.min(Math.floor(progress * total), total - 1)

    bundle.forEach((certificate, index) => {
      let computedStatus: CertificateStatus = "queued"

      if (progress >= 1) {
        computedStatus = "verified"
      } else if (index < activeCertificateIndex) {
        computedStatus = "verified"
      } else if (index === activeCertificateIndex && progress > 0) {
        computedStatus = isActive ? "transferring" : "verified"
      }

      const previousStatus = certificateStatusLogRef.current[certificate.id]
      if (previousStatus === computedStatus) {
        return
      }

      certificateStatusLogRef.current[certificate.id] = computedStatus

      if (computedStatus === "queued") {
        return
      }

      if (computedStatus === "verified" && previousStatus === "transferring") {
        transferLogIdsToFinalize.push(`${activeAction}-cert-${certificate.id}-transferring-${token}`)
      }

      const configuration = CERT_STATUS_LOG_META[computedStatus as Exclude<CertificateStatus, "queued">]
      if (!configuration) {
        return
      }

      const { label, detail } = configuration.build(certificate, token)
      pushLog({
        id: `${activeAction}-cert-${certificate.id}-${computedStatus}-${token}`,
        label,
        detail,
        status: configuration.status,
        timestamp: new Date().toISOString(),
        meta: configuration.meta,
      })
    })

    if (progress >= 1 || transferLogIdsToFinalize.length > 0) {
      setLogs((prev) => {
        let changed = false
        const next = prev.map((log) => {
          const shouldFinalizeMilestone = progress >= 1 && log.meta && PROGRESS_MILESTONE_META.has(log.meta as MilestoneMeta)
          const shouldFinalizeTransfer = transferLogIdsToFinalize.includes(log.id)

          if (!shouldFinalizeMilestone && !shouldFinalizeTransfer) {
            return log
          }

          if (log.status === "success") {
            return log
          }

          changed = true
          return {
            ...log,
            status: "success" as TerminalLogStatus,
            timestamp: new Date().toISOString(),
          }
        })

        return changed ? next : prev
      })
    }
  }, [activeAction, certificateBundle, isActive, progress, pushLog])

  useEffect(() => {
    if (progress < 1 || !activeAction || completionLogged.current) return

    completionLogged.current = true
    const summary = COMPLETION_MESSAGES[activeAction] ?? COMPLETION_MESSAGES.default

    const summaryEntry: TerminalLogEntry = {
      id: `${activeAction}-summary-${Date.now()}`,
      label: summary.label,
      detail: summary.detail,
      status: "success",
      timestamp: new Date().toISOString(),
      meta: summary.meta ?? "DONE",
    }

    const headerId = startLogIdRef.current

    setLogs((prev) => {
      const updated = headerId
        ? prev.map((log) =>
            log.id === headerId
              ? {
                  ...log,
                  status: "success" as TerminalLogStatus,
                  timestamp: new Date().toISOString(),
                }
              : log
          )
        : prev

      return [...updated, summaryEntry]
    })
  }, [activeAction, progress])

  useEffect(() => () => stopAnimation(), [stopAnimation])

  const terminalPrompt = useMemo(() => {
    if (!activeAction) return TERMINAL_PROMPTS.standby
    return TERMINAL_PROMPTS[activeAction] ?? TERMINAL_PROMPTS.standby
  }, [activeAction])

  const footerNote = useMemo(() => {
    if (!activeAction) return "Idle · Awaiting workflow"
    if (progress >= 1) return "Workflow complete · Audit log stored"
    if (isActive) return `Executing ${ACTION_LABELS[activeAction]} pipeline`
    return `${ACTION_LABELS[activeAction]} ready to run`
  }, [activeAction, isActive, progress])

  const startedAtValue = startedAt ?? undefined
  const etaValue = isActive ? etaSeconds : progress >= 1 ? 0 : undefined

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-6 pb-8 pt-6 xl:gap-8 xl:px-8">
      <div className="grid min-h-0 gap-6 lg:grid-cols-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1.05fr)_minmax(0,0.9fr)] xl:items-stretch">
        <CertificateTransferVisualizer
          isActive={isActive}
          progress={progress}
          startedAt={startedAtValue}
          estimatedSecondsRemaining={etaValue}
          className="h-full rounded-[36px]"
        />
        <Terminal
          logs={logs}
          title="Certificate orchestrator"
          prompt={terminalPrompt}
          footerNote={footerNote}
          className="h-full rounded-[36px] border-white/10 bg-gradient-to-br from-white/20 via-white/10 to-white/10 shadow-[0_40px_90px_-50px_rgba(227,55,106,0.45)] backdrop-blur-2xl dark:border-white/10 dark:from-slate-950/45 dark:via-slate-950/30 dark:to-slate-950/50"
        />
        <CertificateTransferControls
          onAction={handleAction}
          onInfo={handleInfo}
          className="h-full rounded-[36px]"
        />
      </div>
    </section>
  )
}

export default CertificatesPage