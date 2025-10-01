import EVCC from "@/components/EVCC"
import ProgressBar from "@/components/ProgressBar"

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
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-brand-50 via-white w-full to-brand-100 text-foreground justify-center items-center">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400/10 blur-[120px]" />
      </div>

      <div className="relative z-10  flex justify-center items-center w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-20 lg:px-10">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/40 bg-white/60 p-8 shadow-sm backdrop-blur">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-brand">
            EV Insights
          </span>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl space-y-3">
              <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                Your premium EV charging dashboard
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Monitor the full charging journey and stay in control of every action. These widgets update in real time once connected to the vehicle backend.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-6 rounded-2xl bg-brand-50/80 px-5 py-4 text-sm text-brand-900 shadow-inner sm:text-base">
              <div>
                <dt className="text-xs uppercase tracking-wide text-brand-600">Active Modules</dt>
                <dd className="text-2xl font-semibold text-brand">02</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-brand-600">Next Service</dt>
                <dd className="text-2xl font-semibold text-brand">04 Nov</dd>
              </div>
            </dl>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:gap-10">
          <EVCC status="charging" chargingProgress={0.68} className="h-full" />
          <ProgressBar
            steps={progressSteps}
            currentStepId="steady"
            progress={0.42}
            showDescriptions
            className="h-full"
            ariaLabel="Charging session progress"
          />
        </div>
      </div>
    </main>
  )
}