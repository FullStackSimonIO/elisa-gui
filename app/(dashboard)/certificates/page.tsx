"use client"

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { toast } from "sonner"

import CertificateTransferControls, {
  type CertificateActionDescriptor,
  type CertificateActionKey,
} from "@/components/certificates/CertificateTransferControls"
import CertificateTransferVisualizer from "@/components/certificates/CertificateTransferVisualizer"
import Terminal, {
  type TerminalLogEntry,
  type TerminalLogStatus,
} from "@/components/Terminal"

const SIMULATION_DURATION_MS = 10000

const ACTION_LABELS: Record<CertificateActionKey, string> = {
  "pre-install": "Pre-Install Certificates",
  distribute: "Distribute Certificates",
  reset: "Reset Certificates",
}

const TERMINAL_PROMPTS: Record<CertificateActionKey | "standby", string> = {
  "pre-install": "certd@oem-prep",
  distribute: "certd@mesh-sync",
  reset: "certd@factory-reset",
  standby: "certd@standby",
}

type CertificateStep = {
  id: string
  label: string
  description?: string
  meta: string
}

const CERTIFICATE_STEPS: Record<CertificateActionKey | "default", CertificateStep[]> = {
  "pre-install": [
    {
      id: "diagnostics",
      label: "Establishing secure channel",
      description: "Negotiating TLS handshake with EVCC controller",
      meta: "STEP 01",
    },
    {
      id: "manifest-verify",
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

      setActiveAction(key)
      setCurrentSteps(steps)
      completionLogged.current = false
      setProgress(0)
      setStartedAt(started)
      setEtaSeconds(Math.ceil(SIMULATION_DURATION_MS / 1000))
      setLogs(initialLogs)
      setSimulationToken(started.getTime())
      setIsActive(true)
    },
    [buildStepLogs, stopAnimation]
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

      let changed = false

      const next = prev.map((log, index) => {
        if (index >= stepCount) {
          return log
        }

        let nextStatus: TerminalLogStatus

        if (progress >= 1) {
          nextStatus = "success"
        } else if (index < activeIndex) {
          nextStatus = "success"
        } else if (index === activeIndex) {
          nextStatus = isActive ? "running" : progress > 0 ? "success" : "pending"
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
    if (progress < 1 || !activeAction || completionLogged.current) return

    completionLogged.current = true
    const summary = COMPLETION_MESSAGES[activeAction] ?? COMPLETION_MESSAGES.default

    setLogs((prev) => [
      ...prev,
      {
        id: `${activeAction}-summary-${Date.now()}`,
        label: summary.label,
        detail: summary.detail,
        status: "success",
        timestamp: new Date().toISOString(),
        meta: summary.meta ?? "DONE",
      },
    ])
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
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <CertificateTransferVisualizer
          isActive={isActive}
          progress={progress}
          startedAt={startedAtValue}
          estimatedSecondsRemaining={etaValue}
          className="h-full"
        />
        <Terminal
          logs={logs}
          title="Certificate orchestrator"
          prompt={terminalPrompt}
          footerNote={footerNote}
          className="rounded-[36px] border-white/10 bg-gradient-to-br from-white/20 via-white/10 to-white/10 shadow-[0_40px_90px_-50px_rgba(227,55,106,0.45)] backdrop-blur-2xl dark:border-white/10 dark:from-slate-950/45 dark:via-slate-950/30 dark:to-slate-950/50"
        />
      </div>

      <CertificateTransferControls
        onAction={handleAction}
        onInfo={handleInfo}
        className="rounded-[36px]"
      />
    </section>
  )
}

export default CertificatesPage