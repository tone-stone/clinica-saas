"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTime } from "@/lib/scheduling";
import { updateAvailability, type AvailabilityFormState } from "@/lib/actions/availability";
import type { StaffHours } from "@/lib/queries/availability";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

const initialState: AvailabilityFormState = {};

export function AvailabilityForm({ staffId, hours }: { staffId: string; hours: StaffHours }) {
  const [state, formAction, isPending] = useActionState(updateAvailability, initialState);
  const [closedDays, setClosedDays] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(DAY_ORDER.map((day) => [day, hours[day] === null]))
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="staffId" value={staffId} />

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        {DAY_ORDER.map((day) => {
          const range = hours[day];
          const closed = closedDays[day];
          return (
            <div key={day} className="flex items-center gap-3">
              <label className="flex w-32 shrink-0 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name={`closed_${day}`}
                  defaultChecked={closed}
                  onChange={(e) =>
                    setClosedDays((prev) => ({ ...prev, [day]: e.target.checked }))
                  }
                  className="size-4 rounded border-input"
                />
                {DAY_LABELS[day]}
              </label>
              <Input
                type="time"
                name={`start_${day}`}
                defaultValue={range ? formatTime(range[0]) : "09:00"}
                disabled={closed}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">a</span>
              <Input
                type="time"
                name={`end_${day}`}
                defaultValue={range ? formatTime(range[1]) : "18:00"}
                disabled={closed}
                className="w-28"
              />
            </div>
          );
        })}
      </div>

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Guardando…" : "Guardar horario"}
      </Button>
    </form>
  );
}
