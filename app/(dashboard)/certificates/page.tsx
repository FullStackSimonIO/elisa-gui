import CertificateTransferControls from "@/components/certificates/CertificateTransferControls"
import CertificateTransferVisualizer from "@/components/certificates/CertificateTransferVisualizer"
import React from "react"

const page = () => {
  return (
    <section className="flex flex-col gap-6">
      <CertificateTransferControls />
      <CertificateTransferVisualizer />
      <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
        EVCC - Install Certificates Process (coming soon)
      </div>
      <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
        Commandline - Running Installation Tasks (coming soon)
      </div>
    </section>
  )
}

export default page