'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  className?: string
  disabled?: boolean
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  disabled = false
}: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10)
    onValueChange([newValue])
  }

  return (
    <div className={cn('relative flex items-center', className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0] || min}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          'w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer',
          'slider-thumb:appearance-none slider-thumb:h-4 slider-thumb:w-4',
          'slider-thumb:rounded-full slider-thumb:bg-primary slider-thumb:cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
    </div>
  )
}