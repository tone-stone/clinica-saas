"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateAppointmentDetails, type AppointmentFormState } from "@/lib/actions/appointments";
import type { StaffOption } from "@/lib/queries/staff";

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const initialState: AppointmentFormState = {};

const PAYMENT_STATUS_OPTIONS = { unpaid: "Sin pagar", paid: "Pagado", waived: "Exento" };

export function EditAppointmentDialog({
  appointmentId,
  staffId,
  scheduledAt,
  durationMinutes,
  reason,
  priceCents,
  paymentStatus,
  staffOptions,
  revalidateTarget,
}: {
  appointmentId: string;
  staffId: string;
  scheduledAt: string;
  durationMinutes: number;
  reason: string | null;
  priceCents?: number | null;
  paymentStatus?: string;
  staffOptions: StaffOption[];
  revalidateTarget: string;
}) {
  const [state, formAction, isPending] = useActionState(updateAppointmentDetails, initialState);
  const [selectedStaffId, setSelectedStaffId] = useState(staffId);

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="size-4" />
        Editar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar cita</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={appointmentId} />
          <input type="hidden" name="staffId" value={selectedStaffId} />
          <input type="hidden" name="revalidateTarget" value={revalidateTarget} />

          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="space-y-2">
            <Label>Profesional</Label>
            <Select
              items={Object.fromEntries(
                staffOptions.map((o) => [o.userId, o.fullName ?? o.email ?? o.userId])
              )}
              value={selectedStaffId}
              onValueChange={(value) => setSelectedStaffId(value ?? "")}
            >
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="editScheduledAt">Fecha y hora</Label>
              <Input
                id="editScheduledAt"
                name="scheduledAt"
                type="datetime-local"
                required
                defaultValue={toDatetimeLocal(scheduledAt)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDuration">Duración (min)</Label>
              <Input
                id="editDuration"
                name="durationMinutes"
                type="number"
                defaultValue={durationMinutes}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editReason">Motivo</Label>
            <Input id="editReason" name="reason" defaultValue={reason ?? ""} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="editPrice">Precio (opcional)</Label>
              <Input
                id="editPrice"
                name="price"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                defaultValue={priceCents != null ? priceCents / 100 : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Estatus de pago</Label>
              <Select items={PAYMENT_STATUS_OPTIONS} name="paymentStatus" defaultValue={paymentStatus ?? "unpaid"}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_STATUS_OPTIONS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
