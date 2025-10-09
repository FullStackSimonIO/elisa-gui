import React from 'react'
import { cn } from '@/lib/utils';

export type MonthlyChargingChartProps = {
    name: string;
    data: number[];
    color?: string;
    className?: string;
}

export type MonthlyChargingDataProps = Record<string, unknown>

const MonthlyChargingChart = ({ name, data, color, className}: MonthlyChargingChartProps) => {
  return (
    <section>
        <div className={cn("monthly-charging-chart", className)} style={{ backgroundColor: color }}>

        </div>
    </section>
  )
}

export default MonthlyChargingChart