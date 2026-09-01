import Link from "next/link";
import { Button } from "@/components/ui/button";
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

export default async function PatientsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return null;

  const supabase = await createClient();
  const { data: patients } = await supabase
    .from("patients")
    .select("id, full_name, email, phone, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pacientes</h1>
        <Button render={<Link href="/pacientes/nuevo">Nuevo paciente</Link>} />
      </div>

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Teléfono</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients?.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>
                  <Link href={`/pacientes/${patient.id}`} className="font-medium hover:underline">
                    {patient.full_name}
                  </Link>
                </TableCell>
                <TableCell>{patient.email ?? "—"}</TableCell>
                <TableCell>{patient.phone ?? "—"}</TableCell>
              </TableRow>
            ))}
            {(!patients || patients.length === 0) && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
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
