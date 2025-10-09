"use client"

import { cn } from "@/lib/utils"

import { AnalogClock } from "./AnalogClock"

export interface ClockCardProps {
  className?: string
  label?: string
  timeZone?: string
  showDate?: boolean
  tickRate?: number
  showSeconds?: boolean
}

import { memo } from "react"

export const ClockCard = memo(function ClockCard({
  className,
  label = "Berlin",
  timeZone = "Europe/Berlin",
  showDate = true,
  tickRate = 1000,
  showSeconds = true,
}: ClockCardProps) {
  return (
    <AnalogClock
      label={label}
      timeZone={timeZone}
      showDate={showDate}
      showSeconds={showSeconds}
      tickRate={tickRate}
      className={cn("h-full", className)}
    />
  )
})

export default ClockCard
