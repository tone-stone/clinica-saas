"use client";

import Link from "next/link";
import { Mail, NotebookPen, Phone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppointmentStatusActions } from "@/components/appointment-status-actions";
import { updatePaymentStatus } from "@/lib/actions/appointments";
import { cn } from "@/lib/utils";
import type { AppointmentStatus, PaymentStatus } from "@/lib/supabase/database.types";

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Sin pagar",
  paid: "Pagado",
  waived: "Exento",
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No asistió",
};

const STATUS_VARIANT: Record<AppointmentStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
};

const CHIP_CLASS: Record<AppointmentStatus, string> = {
  pending: "bg-muted text-foreground hover:bg-muted/70",
  confirmed: "bg-accent text-accent-foreground hover:bg-accent/70",
  completed: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
  cancelled: "bg-destructive/10 text-destructive/70 line-through hover:bg-destructive/15",
  no_show: "bg-destructive/10 text-destructive/70 line-through hover:bg-destructive/15",
};

const ROW_ACCENT_CLASS: Record<AppointmentStatus, string> = {
  pending: "border-l-muted-foreground/40",
  confirmed: "border-l-primary",
  completed: "border-l-secondary-foreground/50",
  cancelled: "border-l-destructive/50",
  no_show: "border-l-destructive/50",
};

export function AppointmentChip({
  appointmentId,
  patientId,
  patientName,
  patientEmail,
  patientPhone,
  staffName,
  scheduledAt,
  durationMinutes,
  reason,
  status,
  priceCents,
  paymentStatus,
  intake,
  variant = "chip",
  revalidateTarget = "/citas",
}: {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientEmail: string | null;
  patientPhone: string | null;
  staffName: string;
  scheduledAt: string;
  durationMinutes: number;
  reason: string | null;
  status: AppointmentStatus;
  priceCents?: number | null;
  paymentStatus?: PaymentStatus;
  /** Contexto de pre-consulta que el propio paciente llenó (si lo hizo). */
  intake?: { motivo: string | null; sintomas: string | null; severidad: string | null } | null;
  /** "chip": compacto para celdas de calendario. "row": fila completa para listas. */
  variant?: "chip" | "row";
  revalidateTarget?: string;
}) {
  const timeLabel = new Date(scheduledAt).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog>
      {variant === "row" ? (
        <DialogTrigger
          render={
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border border-l-4 bg-card px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50",
                ROW_ACCENT_CLASS[status]
              )}
            />
          }
        >
          <span className="tabular-nums font-medium">{timeLabel}</span>
          <span className="min-w-0 flex-1 truncate font-medium">{patientName}</span>
          <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{staffName}</span>
          <Badge variant={STATUS_VARIANT[status]} className="shrink-0">
            {STATUS_LABEL[status]}
          </Badge>
        </DialogTrigger>
      ) : (
        <DialogTrigger
          render={
            <button
              className={cn(
                "w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium transition-colors",
                CHIP_CLASS[status]
              )}
            />
          }
        >
          <span className="tabular-nums">{timeLabel}</span> {patientName}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{patientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            {patientEmail && (
              <span className="flex items-center gap-1">
                <Mail className="size-3.5" /> {patientEmail}
              </span>
            )}
            {patientPhone && (
              <span className="flex items-center gap-1">
                <Phone className="size-3.5" /> {patientPhone}
              </span>
            )}
            {!patientEmail && !patientPhone && "Sin datos de contacto"}
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {new Date(scheduledAt).toLocaleString("es", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <User className="size-3.5" /> {staffName} · {durationMinutes} min
            </p>
            {reason && <p className="mt-2 text-sm text-muted-foreground">{reason}</p>}
          </div>

          {(intake?.motivo || intake?.sintomas) && (
            <div className="rounded-lg border border-dashed p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <NotebookPen className="size-3.5" /> Contado por el paciente antes de la cita
              </p>
              {intake.motivo && <p className="mt-1.5 text-sm">{intake.motivo}</p>}
              {intake.sintomas && (
                <p className="mt-1 text-sm text-muted-foreground">{intake.sintomas}</p>
              )}
              {intake.severidad && (
                <Badge variant="outline" className="mt-1.5 capitalize">
                  {intake.severidad}
                </Badge>
              )}
            </div>
          )}

          {priceCents != null && (
            <div className="flex items-center justify-between rounded-lg border border-dashed p-3 text-sm">
              <span>${(priceCents / 100).toLocaleString("es")}</span>
              <div className="flex items-center gap-2">
                <Badge variant={paymentStatus === "paid" ? "secondary" : "outline"}>
                  {PAYMENT_LABEL[paymentStatus ?? "unpaid"]}
                </Badge>
                {paymentStatus !== "paid" && (
                  <form action={updatePaymentStatus}>
                    <input type="hidden" name="id" value={appointmentId} />
                    <input type="hidden" name="paymentStatus" value="paid" />
                    <input type="hidden" name="revalidateTarget" value={revalidateTarget} />
                    <button type="submit" className="text-xs text-primary hover:underline">
                      Marcar pagado
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          <AppointmentStatusActions
            appointmentId={appointmentId}
            status={status}
            revalidateTarget={revalidateTarget}
          />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" size="sm" />}>Cerrar</DialogClose>
          <Button size="sm" render={<Link href={`/pacientes/${patientId}`}>Ver ficha completa</Link>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
