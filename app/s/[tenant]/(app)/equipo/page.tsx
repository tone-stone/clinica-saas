import { createClient } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { getCurrentMembership } from "@/lib/tenant/get-membership";
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

  return (
    <div>
      <h1 className="text-2xl font-semibold">Equipo</h1>

      <div className="mt-6 space-y-2">
        {memberships?.map((m) => {
          const profile = profiles?.find((p) => p.id === m.user_id);
          return (
            <div key={m.user_id} className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{profile?.full_name ?? profile?.email ?? m.user_id}</p>
              <p className="text-muted-foreground">
                {m.role === "owner" ? "Dueño/a" : STAFF_ROLE_LABEL[m.staff_role ?? ""] ?? "Staff"}
              </p>
            </div>
          );
        })}
      </div>

      {membership?.role === "owner" && (
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
