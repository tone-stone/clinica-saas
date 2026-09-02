"use client";

import { useActionState, useMemo, useState } from "react";
import { Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { addDays, dateKey, formatTime } from "@/lib/scheduling";
import type { AppointmentFormState } from "@/lib/actions/appointments";
import type { StaffOption } from "@/lib/queries/staff";
import type { BusySlot } from "@/lib/queries/appointments";
import type { StaffHours } from "@/lib/queries/availability";

const DAYS_AHEAD = 21;
const STEP_MINUTES = 30;
const DURATIONS = [30, 45, 60] as const;

function isSlotBusy(
  staffId: string,
  day: Date,
  startMinutes: number,
  durationMinutes: number,
  busySlots: BusySlot[]
) {
  const key = dateKey(day);
  return busySlots.some((slot) => {
    if (slot.staffId !== staffId) return false;
    const slotDate = new Date(slot.start);
    if (dateKey(slotDate) !== key) return false;
    const slotStart = slotDate.getHours() * 60 + slotDate.getMinutes();
    const slotEnd = slotStart + slot.durationMinutes;
    return startMinutes < slotEnd && startMinutes + durationMinutes > slotStart;
  });
}

function buildSlots(
  day: Date,
  durationMinutes: number,
  staffId: string,
  busySlots: BusySlot[],
  staffHours: StaffHours
) {
  const hours = staffHours[day.getDay()];
  if (!hours) return [];

  const now = new Date();
  const isToday = dateKey(day) === dateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [start, end] = hours;
  const slots: { minutes: number; disabled: boolean }[] = [];
  for (let t = start; t + durationMinutes <= end; t += STEP_MINUTES) {
    const disabled =
      (isToday && t <= nowMinutes) || isSlotBusy(staffId, day, t, durationMinutes, busySlots);
    slots.push({ minutes: t, disabled });
  }
  return slots;
}

function groupSlots(slots: { minutes: number; disabled: boolean }[]) {
  const groups: { label: string; slots: typeof slots }[] = [
    { label: "Mañana", slots: [] },
    { label: "Tarde", slots: [] },
    { label: "Noche", slots: [] },
  ];
  for (const slot of slots) {
    if (slot.minutes < 12 * 60) groups[0].slots.push(slot);
    else if (slot.minutes < 18 * 60) groups[1].slots.push(slot);
    else groups[2].slots.push(slot);
  }
  return groups.filter((g) => g.slots.length > 0);
}

export function AppointmentScheduler({
  staffOptions,
  busySlots,
  availabilityByStaff,
  action,
  hiddenFields,
  submitLabel,
  pendingLabel,
  allowDurationSelect = false,
}: {
  staffOptions: StaffOption[];
  busySlots: BusySlot[];
  availabilityByStaff: Record<string, StaffHours>;
  action: (state: AppointmentFormState, formData: FormData) => Promise<AppointmentFormState>;
  hiddenFields?: Record<string, string>;
  submitLabel: string;
  pendingLabel: string;
  allowDurationSelect?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, {} as AppointmentFormState);
  const [staffId, setStaffId] = useState(staffOptions[0]?.userId ?? "");
  const [dayOffset, setDayOffset] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);

  const days = useMemo(
    () => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(new Date(), i)),
    []
  );
  const selectedDay = days[dayOffset];
  const staffHours = useMemo(
    () => availabilityByStaff[staffId] ?? {},
    [availabilityByStaff, staffId]
  );

  const groupedSlots = useMemo(
    () => groupSlots(buildSlots(selectedDay, durationMinutes, staffId, busySlots, staffHours)),
    [selectedDay, durationMinutes, staffId, busySlots, staffHours]
  );

  function selectStaff(id: string) {
    setStaffId(id);
    setSelectedMinutes(null);
  }
  function selectDay(offset: number) {
    setDayOffset(offset);
    setSelectedMinutes(null);
  }
  function selectDuration(minutes: number) {
    setDurationMinutes(minutes);
    setSelectedMinutes(null);
  }

  const scheduledAtValue =
    selectedMinutes !== null
      ? `${dateKey(selectedDay)}T${formatTime(selectedMinutes)}`
      : "";

  const selectedStaffName =
    staffOptions.find((s) => s.userId === staffId)?.fullName ??
    staffOptions.find((s) => s.userId === staffId)?.email ??
    "";

  return (
    <form action={formAction} className="space-y-6">
      {Object.entries(hiddenFields ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input type="hidden" name="staffId" value={staffId} />
      <input type="hidden" name="scheduledAt" value={scheduledAtValue} />
      <input type="hidden" name="durationMinutes" value={durationMinutes} />

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {staffOptions.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-medium">Especialista</p>
          <div className="flex flex-wrap gap-2">
            {staffOptions.map((option) => {
              const label = option.fullName ?? option.email ?? "Profesional";
              const active = option.userId === staffId;
              return (
                <button
                  key={option.userId}
                  type="button"
                  onClick={() => selectStaff(option.userId)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-[10px] font-semibold",
                      active ? "bg-primary-foreground/20" : "bg-accent text-accent-foreground"
                    )}
                  >
                    {label.charAt(0).toUpperCase()}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {allowDurationSelect && (
        <div>
          <p className="mb-2 text-sm font-medium">Duración de la sesión</p>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => selectDuration(d)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                  durationMinutes === d
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted"
                )}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium">Fecha</p>
        <div className="scrollbar-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {days.map((day, i) => {
            const active = i === dayOffset;
            const closed = !staffHours[day.getDay()];
            return (
              <button
                key={i}
                type="button"
                onClick={() => selectDay(i)}
                disabled={closed}
                className={cn(
                  "flex w-14 shrink-0 flex-col items-center rounded-lg border py-2 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : closed
                      ? "border-border bg-muted text-muted-foreground opacity-50"
                      : "border-border bg-card hover:bg-muted"
                )}
              >
                <span className="text-[11px] uppercase opacity-80">
                  {i === 0 ? "Hoy" : day.toLocaleDateString("es", { weekday: "short" })}
                </span>
                <span className="text-base font-semibold">{day.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Horario disponible</p>
        {groupedSlots.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            No hay horarios disponibles este día.
          </p>
        ) : (
          <div className="space-y-4">
            {groupedSlots.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.slots.map((slot) => {
                    const active = slot.minutes === selectedMinutes;
                    return (
                      <button
                        key={slot.minutes}
                        type="button"
                        disabled={slot.disabled}
                        onClick={() => setSelectedMinutes(slot.minutes)}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-sm font-medium tabular-nums transition-colors",
                          slot.disabled
                            ? "cursor-not-allowed border-border/50 text-muted-foreground/40 line-through"
                            : active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card hover:border-primary/50 hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {formatTime(slot.minutes)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Card className="gap-3 border-t-2 border-t-primary/30 p-4">
        {selectedMinutes !== null ? (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="size-4 shrink-0 text-primary" />
            <span>
              {selectedStaffName && <strong>{selectedStaffName}</strong>}
              {selectedStaffName && " · "}
              {selectedDay.toLocaleDateString("es", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              · {formatTime(selectedMinutes)} ({durationMinutes} min)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="size-4 shrink-0" />
            Selecciona un horario disponible para continuar
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs">
              Motivo (opcional)
            </Label>
            <Input id="reason" name="reason" placeholder="Ej. primera consulta, seguimiento…" />
          </div>
          <Button type="submit" disabled={selectedMinutes === null || isPending}>
            {isPending ? pendingLabel : submitLabel}
          </Button>
        </div>
      </Card>
    </form>
  );
}
