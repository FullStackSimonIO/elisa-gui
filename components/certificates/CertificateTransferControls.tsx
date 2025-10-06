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


// Predefined set of actions from Elisa Documentation
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
    variant: "default",
  },
  {
    key: "reset",
    label: "Reset Certificates",
    description:
      "Remove installed certificates and restore factory trust settings.",
    icon: RotateCcw,
    variant: "default",
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
    "certificate-transfer-controls relative isolate overflow-hidden rounded-[32px] border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 p-4 shadow-[0_36px_76px_-48px_rgba(227,55,106,0.45)] backdrop-blur-2xl",
    "dark:border-white/10 dark:from-slate-950/40 dark:via-slate-950/20 dark:to-slate-950/40",
    "before:absolute before:-left-32 before:-top-24 before:h-64 before:w-64 before:rounded-[32px] before:bg-brand-300/40 before:blur-[120px] before:content-['']",
    "after:absolute after:-bottom-24 after:-right-20 after:h-72 after:w-72 after:bg-gradient-to-br after:from-brand-200/20 after:via-primary/10 after:to-brand-500/20 after:opacity-70 after:blur-[140px] after:content-['']",
    "before:[clip-path:polygon(12%_0%,100%_8%,88%_100%,0%_84%)] after:[clip-path:polygon(0%_18%,75%_0%,100%_70%,18%_100%)]",
    className
  )}
      aria-label="Certificate management actions"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Certificate Workflow
          </p>
          <h2 className="mt-1.5 text-xl font-semibold text-foreground">
            Manage Certificates
          </h2>
        </div>
      </header>

  <div className="mt-4 flex flex-col gap-3.5">
        {normalizedActions.map((descriptor) => {
          const { key, label, description, icon: Icon, variant } = descriptor

          return (
            <article
              key={key}
              className="group relative flex flex-col gap-3 overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-white/25 via-white/10 to-white/20 p-3.5 text-sm shadow-[0_22px_58px_-42px_rgba(227,55,106,0.35)] transition-all duration-500 hover:-translate-y-1 hover:border-brand-300/60 hover:shadow-[0_40px_96px_-64px_rgba(227,55,106,0.55)] dark:border-white/5 dark:from-slate-950/40 dark:via-slate-950/30 dark:to-slate-950/50"
            >
              <span className="pointer-events-none absolute inset-px rounded-[20px] border border-white/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:border-white/10" />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-brand-300/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100/70 via-brand-400/35 to-primary/40 text-brand shadow-[0_16px_46px_-42px_rgba(227,55,106,0.5)]">
                  <Icon className="h-[20px] w-[20px]" aria-hidden />
                </span>

                <Tooltip delayDuration={50}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full border border-white/20 bg-white/5 text-muted-foreground backdrop-blur-lg transition hover:border-brand-300/60 hover:text-foreground dark:border-white/10 dark:bg-white/5"
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

              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-foreground">{label}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>

              <Button
                type="button"
                variant={variant}
                className="mt-auto justify-center rounded-2xl border border-white/20 py-2.5 font-semibold backdrop-blur duration-500 hover:border-brand-400/70 dark:border-white/10"
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
