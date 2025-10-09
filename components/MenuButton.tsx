"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"

export function MenuButton() {
  return (
    <div className="fixed left-6 top-6 z-40">
      <SidebarTrigger className="h-16 w-16 rounded-2xl border-2 border-border/70 bg-background/95 text-foreground shadow-lg backdrop-blur-sm transition-all hover:border-brand/70 hover:bg-brand/20 hover:shadow-xl hover:shadow-brand/20 [&_svg]:!size-10" />
    </div>
  )
}
