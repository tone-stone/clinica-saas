"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/**
 * Selector de fecha con navegación por dropdown de mes/año (en vez de flecha
 * por flecha): clave para capturar fechas de nacimiento lejanas sin tener que
 * hacer decenas de clics para retroceder años.
 */
export function DatePicker({
  name,
  id,
  defaultValue,
  placeholder = "Selecciona una fecha",
}: {
  name: string
  id?: string
  /** "YYYY-MM-DD" */
  defaultValue?: string | null
  placeholder?: string
}) {
  const [date, setDate] = React.useState<Date | undefined>(
    defaultValue ? new Date(`${defaultValue}T00:00:00`) : undefined
  )
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <input type="hidden" name={name} value={date ? toIsoDate(date) : ""} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start font-normal",
                !date && "text-muted-foreground"
              )}
            />
          }
        >
          <CalendarIcon className="size-4" />
          {date
            ? date.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })
            : placeholder}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={date}
            defaultMonth={date}
            onSelect={(value) => {
              setDate(value)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </>
  )
}
