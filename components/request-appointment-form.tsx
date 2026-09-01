"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requestAppointment, type AppointmentFormState } from "@/lib/actions/appointments";
import type { StaffOption } from "@/lib/queries/staff";

const initialState: AppointmentFormState = {};

export function RequestAppointmentForm({ staffOptions }: { staffOptions: StaffOption[] }) {
  const [state, formAction, isPending] = useActionState(requestAppointment, initialState);
  const [staffId, setStaffId] = useState(staffOptions[0]?.userId ?? "");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="staffId" value={staffId} />

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label>Profesional</Label>
        <Select value={staffId} onValueChange={(value) => setStaffId(value ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona un profesional" />
          </SelectTrigger>
          <SelectContent>
            {staffOptions.map((option) => (
              <SelectItem key={option.userId} value={option.userId}>
                {option.fullName ?? option.email ?? option.userId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduledAt">Fecha y hora deseada</Label>
        <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Motivo</Label>
        <Input id="reason" name="reason" />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enviando…" : "Solicitar cita"}
      </Button>
    </form>
  );
}
