"use client"

import * as React from "react"
import { BatteryCharging, BatteryFull, BatteryMedium, BatteryLow } from "lucide-react"
import { cn } from "@/lib/utils"

// Interface for Battery Status
interface BatteryStatusProps {
    level?: number // Battery level percentage as an Integer (0-100)
    isCharging?: boolean // Boolean indicating if we currently have an ongoing charging process
    className?: string // Additional class names that use the CN utility function
    label?: string // Aria-label for accessibility
}

const BatteryStatus: React.FC<BatteryStatusProps> = ({
    // Mock-Data for now - to be replaced with actual data from the Backend
    level = 19,
    isCharging = false,
    className,
    label = "Battery status",
}) => {
    const clamped = React.useMemo(() => Math.min(100, Math.max(0, level)), [level])
    const isLow = clamped <= 20
    const Icon = isCharging ? BatteryCharging : clamped > 80 ? BatteryFull : BatteryMedium

    return (
        <div className={cn("flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur", isCharging && "border-brand/70 text-brand", isLow && !isCharging && "border-destructive/70 text-brand", className)} aria-label={label}>
            <Icon className="h-4 w-4" aria-hidden="true"  />
            <div className="flex items-center gap-1 font-medium tracking-wide">
                <span>{clamped}%</span>
                {isCharging && <span className="uppercase text-[0.6rem]">Charging Battery...</span>}
            </div>
        </div>
    )
}

export default BatteryStatus