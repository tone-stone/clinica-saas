import Link from "next/link";
import { CalendarClock, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { getPatientSummaries } from "@/lib/queries/patient-summaries";
import { getClinicalStaff } from "@/lib/queries/staff";
import { getAuthenticatedAssetUrl } from "@/lib/cloudinary/signed-url";
import type { AppointmentStatus } from "@/lib/supabase/database.types";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No asistió",
};

export default async function PatientsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return null;

  const supabase = await createClient();
  const [{ data: patients }, staffOptions] = await Promise.all([
    supabase
      .from("patients")
      .select("id, full_name, email, phone, photo_public_id, created_at")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false }),
    getClinicalStaff(tenant.id),
  ]);

  const summaries = await getPatientSummaries(tenant.id, (patients ?? []).map((p) => p.id));
  const staffNameById = new Map(
    staffOptions.map((s) => [s.userId, s.fullName ?? s.email ?? "Profesional"])
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
        <Button render={<Link href="/pacientes/nuevo">Nuevo paciente</Link>} />
      </div>

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Próxima cita</TableHead>
              <TableHead>Padecimiento</TableHead>
              <TableHead>Profesional a cargo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients?.map((patient) => {
              const summary = summaries[patient.id];
              const upcoming = summary?.nextAppointment;
              const last = summary?.lastAppointment;
              const staffName = summary?.assignedStaffId
                ? staffNameById.get(summary.assignedStaffId)
                : null;
              return (
                <TableRow key={patient.id}>
                  <TableCell className="whitespace-normal">
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm">
                        {patient.photo_public_id && (
                          <AvatarImage
                            src={getAuthenticatedAssetUrl(patient.photo_public_id, "image")}
                            alt={patient.full_name}
                          />
                        )}
                        <AvatarFallback>{initialsOf(patient.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link
                          href={`/pacientes/${patient.id}`}
                          className="font-medium hover:underline"
                        >
                          {patient.full_name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {[patient.email, patient.phone].filter(Boolean).join(" · ") || "Sin contacto"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {upcoming ? (
                      <div className="flex items-center gap-1.5">
                        <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" />
                        <span>
                          {new Date(upcoming.scheduledAt).toLocaleString("es", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <Badge variant="outline" className="ml-1">
                          {STATUS_LABEL[upcoming.status]}
                        </Badge>
                      </div>
                    ) : last ? (
                      <span className="text-muted-foreground">
                        Última:{" "}
                        {new Date(last.scheduledAt).toLocaleDateString("es", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Sin citas</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-56 truncate whitespace-normal" title={summary?.condition ?? undefined}>
                    {summary?.condition ? (
                      <span className="line-clamp-1">{summary.condition}</span>
                    ) : (
                      <span className="text-muted-foreground">Sin registrar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {staffName ? (
                      <div className="flex items-center gap-1.5">
                        <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
                        <span>{staffName}</span>
                        {summary && summary.completedSessions > 0 && (
                          <span className="text-xs text-muted-foreground">
                            · {summary.completedSessions}{" "}
                            {summary.completedSessions === 1 ? "sesión" : "sesiones"}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sin asignar</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {(!patients || patients.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Aún no hay pacientes registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
