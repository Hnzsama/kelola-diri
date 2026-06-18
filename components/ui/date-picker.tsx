"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon } from "@hugeicons/core-free-icons"

export interface DatePickerProps {
  value?: string // YYYY-MM-DD
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  className,
  disabled,
}: DatePickerProps) {
  // Convert string (YYYY-MM-DD) to Date object safely without timezone offset issues
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    const parts = value.split("-")
    if (parts.length !== 3) return undefined
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    const parsed = new Date(year, month, day)
    return isNaN(parsed.getTime()) ? undefined : parsed
  }, [value])

  const handleSelect = (selectedDate: Date | undefined) => {
    if (!onChange) return
    if (!selectedDate) {
      onChange("")
      return
    }
    // Format to YYYY-MM-DD local time string
    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0")
    const day = String(selectedDate.getDate()).padStart(2, "0")
    onChange(`${year}-${month}-${day}`)
  }

  const formattedDate = React.useMemo(() => {
    if (!dateValue) return ""
    return dateValue.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }, [dateValue])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start text-left font-normal border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:bg-muted/50 rounded-none active:translate-y-0",
            !value && "text-muted-foreground",
            className
          )}
        >
          <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="mr-2 size-4" />
          {formattedDate || <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  )
}
