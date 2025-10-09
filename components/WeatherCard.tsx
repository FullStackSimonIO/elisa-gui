"use client"

import * as React from "react"
import { Cloud, CloudRain, CloudSnow, Sun } from "lucide-react"

import { cn } from "@/lib/utils"

export type WeatherCondition = "sunny" | "cloudy" | "rainy" | "snowy"

export interface WeatherCardProps {
  condition?: WeatherCondition
  temperature?: number
  location?: string
  humidity?: number
  windSpeed?: number
  className?: string
}

const WEATHER_ICONS: Record<
  WeatherCondition,
  {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    gradient: string
    label: string
  }
> = {
  sunny: {
    icon: Sun,
    gradient: "from-amber-400/20 via-orange-300/15 to-yellow-400/20",
    label: "Sonnig",
  },
  cloudy: {
    icon: Cloud,
    gradient: "from-slate-400/20 via-gray-300/15 to-slate-400/20",
    label: "Bewölkt",
  },
  rainy: {
    icon: CloudRain,
    gradient: "from-blue-400/20 via-cyan-300/15 to-blue-400/20",
    label: "Regen",
  },
  snowy: {
    icon: CloudSnow,
    gradient: "from-blue-200/20 via-slate-200/15 to-blue-200/20",
    label: "Schnee",
  },
}

export function WeatherCard({
  condition = "sunny",
  temperature = 22,
  location = "Berlin",
  humidity = 65,
  windSpeed = 12,
  className,
}: WeatherCardProps) {
  const weatherData = WEATHER_ICONS[condition]
  const Icon = weatherData.icon

  return (
    <section
      className={cn(
        "relative isolate flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950/75 via-slate-900/50 to-slate-900/60 p-6 shadow-[0_30px_70px_-44px_rgba(236,72,153,0.5)] backdrop-blur-2xl dark:border-white/10",
        className
      )}
      aria-label={`Weather in ${location}`}
    >
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className={cn(
            "absolute -right-16 top-0 h-48 w-48 rounded-full blur-3xl",
            weatherData.gradient
          )}
        />
        <div className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-brand/15 blur-3xl" />
      </div>

      {/* Header */}
      

      {/* Main Weather Display */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="relative">
          <Icon
            className={cn(
              "h-32 w-32 text-brand-100",
              condition === "sunny" && "text-amber-300",
              condition === "cloudy" && "text-slate-300",
              condition === "rainy" && "text-cyan-300",
              condition === "snowy" && "text-blue-200"
            )}
            aria-hidden="true"
          />
          <div
            className={cn(
              "absolute inset-0 rounded-full blur-2xl opacity-40",
              condition === "sunny" && "bg-amber-400",
              condition === "cloudy" && "bg-slate-400",
              condition === "rainy" && "bg-cyan-400",
              condition === "snowy" && "bg-blue-300"
            )}
            aria-hidden="true"
          />
        </div>

        <div className="text-center">
          <p className="text-7xl font-bold text-brand-50">{temperature}°C</p>
          <p className="mt-2 text-3xl font-semibold text-muted-foreground">
            {weatherData.label}
          </p>
        </div>
      </div>

     
    </section>
  )
}

export default WeatherCard
