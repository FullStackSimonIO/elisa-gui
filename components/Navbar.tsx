"use client"

import Link from "next/link"

import { SidebarTrigger } from "@/components/ui/sidebar"
import Battery from "./Battery"

const Navbar = () => {
  return (
    <header className="flex h-16 w-full shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-5 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="rounded-full border border-border/70 bg-muted/60 text-foreground hover:bg-brand/20 hover:text-foreground" size={"lg"} />
        <Link href="/" className="flex flex-col leading-tight text-3xl">
          <span className="font-semibold uppercase tracking-[0.4em] text-sforeground">Elisa</span>
        </Link>
      </div>
    </header>
  )
}

export default Navbar