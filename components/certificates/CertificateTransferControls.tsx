"use client"

import * as React from "react"
import { Info, ShieldCheck, Share2, RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export type CertificateActionKey = "pre-install" | "distribute" | "reset"

export interface CertificateActionDescriptor {
  key: CertificateActionKey
  label: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  variant?: React.ComponentProps<typeof Button>["variant"]
}

export interface CertificateTransferControlsProps {
  /** Callback when the primary button is clicked. */
  onAction?: (key: CertificateActionKey) => void
  /** Callback when the info button is clicked or hovered (optional). */
  onInfo?: (descriptor: CertificateActionDescriptor) => void
  /** Override the default action descriptors. */
  actions?: CertificateActionDescriptor[]
  className?: string
}

const DEFAULT_ACTIONS: CertificateActionDescriptor[] = [
  {
    key: "pre-install",
    label: "Pre-Install Certificates",
    description:
      "Prepare the vehicle controller by uploading OEM certificates before the session starts.",
    icon: ShieldCheck,
    variant: "default",
  },
  {
    key: "distribute",
    label: "Distribute Certificates",
    description:
      "Push the certificate bundle to all required EVCC modules and verify integrity.",
    icon: Share2,
    variant: "secondary",
  },
  {
    key: "reset",
    label: "Reset Certificates",
    description:
      "Remove installed certificates and restore factory trust settings.",
    icon: RotateCcw,
    variant: "outline",
  },
]

export function CertificateTransferControls({
  onAction,
  onInfo,
  actions = DEFAULT_ACTIONS,
  className,
}: CertificateTransferControlsProps) {
  const normalizedActions = React.useMemo(() => {
    const byKey = new Map<CertificateActionKey, CertificateActionDescriptor>()
    for (const action of DEFAULT_ACTIONS) {
      byKey.set(action.key, action)
    }

    for (const action of actions) {
      byKey.set(action.key, action)
    }

    return Array.from(byKey.values())
  }, [actions])

  const handleAction = React.useCallback(
    (descriptor: CertificateActionDescriptor) => {
      onAction?.(descriptor.key)
    },
    [onAction]
  )

  const handleInfo = React.useCallback(
    (descriptor: CertificateActionDescriptor) => {
      onInfo?.(descriptor)
    },
    [onInfo]
  )

  return (
    <section
      className={cn(
        "certificate-transfer-controls relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-5 shadow-sm backdrop-blur",
        "before:absolute before:-left-24 before:top-1/2 before:h-64 before:w-64 before:-translate-y-1/2 before:rounded-full before:bg-brand/10 before:blur-3xl before:content-['']",
        className
      )}
      aria-label="Certificate management actions"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Certificate Workflow
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Manage Certificates
          </h2>
        </div>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {normalizedActions.map((descriptor) => {
          const { key, label, description, icon: Icon, variant } = descriptor

          return (
            <article
              key={key}
              className="group relative flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/60 p-4 text-sm transition hover:border-primary/60 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>

                <Tooltip delayDuration={50}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full border border-border/60 text-muted-foreground transition hover:text-foreground"
                      onClick={() => handleInfo(descriptor)}
                      aria-label={`${label} details`}
                    >
                      <Info className="h-4 w-4" aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={8} className="max-w-xs text-left">
                    <p className="font-medium text-sm text-foreground">{label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">{label}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>

              <Button
                type="button"
                variant={variant}
                className="mt-auto justify-center rounded-2xl font-semibold"
                onClick={() => handleAction(descriptor)}
              >
                Execute
              </Button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default CertificateTransferControls
