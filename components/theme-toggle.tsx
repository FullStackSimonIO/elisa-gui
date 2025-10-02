"use client"

import * as React from "react"
import { MoonStar, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? resolvedTheme === "dark" : false

  const handleCheckedChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-full border border-border/60 bg-card/70 px-4 py-2 shadow-sm backdrop-blur",
        className
      )}
    >
      <Sun className={cn("size-4 text-muted-foreground transition-transform", isDark && "scale-90 opacity-60")} />
      <Switch
        aria-label="Toggle dark mode"
        checked={isDark}
        onCheckedChange={handleCheckedChange}
        disabled={!mounted}
        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
      />
      <MoonStar className={cn("size-4 text-muted-foreground transition-transform", !isDark && "scale-90 opacity-60")} />
    </div>
  )
}
