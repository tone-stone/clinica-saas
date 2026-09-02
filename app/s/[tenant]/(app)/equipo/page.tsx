import { Clock } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AvailabilityForm } from "@/components/availability-form";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { getCurrentMembership } from "@/lib/tenant/get-membership";
import { getAvailabilityMap } from "@/lib/queries/availability";
import { InviteStaffForm } from "@/components/invite-staff-form";

const STAFF_ROLE_LABEL: Record<string, string> = {
  doctor: "Doctor/a",
  psicologo: "Psicólogo/a",
  recepcion: "Recepción",
};

export default async function TeamPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return null;

  const [membership, supabase] = await Promise.all([
    getCurrentMembership(tenant.id),
    createClient(),
  ]);

  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id, role, staff_role")
    .eq("tenant_id", tenant.id)
    .in("role", ["owner", "staff"]);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", (memberships ?? []).map((m) => m.user_id));

  const isOwner = membership?.role === "owner";
  const clinicalMembers = (memberships ?? []).filter(
    (m) => m.role === "owner" || m.staff_role === "doctor" || m.staff_role === "psicologo"
  );
  const availabilityMap = await getAvailabilityMap(
    tenant.id,
    clinicalMembers.map((m) => m.user_id)
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Equipo</h1>

      <div className="mt-6 space-y-2">
        {memberships?.map((m) => {
          const profile = profiles?.find((p) => p.id === m.user_id);
          const name = profile?.full_name ?? profile?.email ?? m.user_id;
          const canEditSchedule =
            (m.role === "owner" || m.staff_role === "doctor" || m.staff_role === "psicologo") &&
            (isOwner || membership?.userId === m.user_id);

          return (
            <Card key={m.user_id} className="flex-row items-center justify-between p-3">
              <div className="text-sm">
                <p className="font-medium">{name}</p>
                <p className="text-muted-foreground">
                  {m.role === "owner" ? "Dueño/a" : STAFF_ROLE_LABEL[m.staff_role ?? ""] ?? "Staff"}
                </p>
              </div>
              {canEditSchedule && (
                <Dialog>
                  <DialogTrigger render={<Button variant="outline" size="sm" />}>
                    <Clock className="size-4" />
                    Horario
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Horario de atención — {name}</DialogTitle>
                    </DialogHeader>
                    <AvailabilityForm
                      staffId={m.user_id}
                      hours={availabilityMap[m.user_id]}
                    />
                    <DialogFooter>
                      <DialogClose render={<Button variant="outline" size="sm" />}>
                        Cerrar
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </Card>
          );
        })}
      </div>

      {isOwner && (
        <div className="mt-8">
          <h2 className="text-lg font-medium">Invitar a alguien nuevo</h2>
          <div className="mt-4">
            <InviteStaffForm />
          </div>
        </div>
      )}
    </div>
  );
}
