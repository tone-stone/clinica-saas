import { updateAppointmentStatus } from "@/lib/actions/appointments";
import { Button } from "@/components/ui/button";
import type { AppointmentStatus } from "@/lib/supabase/database.types";

type Variant = "default" | "outline" | "destructive" | "ghost";

const NEXT_ACTIONS: Partial<
  Record<AppointmentStatus, { status: AppointmentStatus; label: string; variant?: Variant }[]>
> = {
  pending: [
    { status: "confirmed", label: "Confirmar" },
    { status: "cancelled", label: "Cancelar", variant: "outline" },
  ],
  confirmed: [
    { status: "completed", label: "Completada" },
    { status: "no_show", label: "No asistió", variant: "outline" },
    { status: "cancelled", label: "Cancelar", variant: "outline" },
  ],
};

export function AppointmentStatusActions({
  appointmentId,
  status,
  revalidateTarget,
}: {
  appointmentId: string;
  status: AppointmentStatus;
  revalidateTarget: string;
}) {
  const actions = NEXT_ACTIONS[status];
  if (!actions) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <form key={action.status} action={updateAppointmentStatus}>
          <input type="hidden" name="id" value={appointmentId} />
          <input type="hidden" name="status" value={action.status} />
          <input type="hidden" name="revalidateTarget" value={revalidateTarget} />
          <Button type="submit" size="sm" variant={action.variant ?? "default"}>
            {action.label}
          </Button>
        </form>
      ))}
    </div>
  );
}
