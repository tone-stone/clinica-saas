import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { LoginForm } from "@/components/login-form";
import { AuthShell } from "@/components/auth-shell";

export default async function TenantLoginPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  const clinicName = tenant?.name ?? "tu clínica";

  return (
    <AuthShell
      title={`Ingresa a ${clinicName}`}
      subtitle="Usa el correo y la contraseña de tu cuenta para acceder al panel de la clínica."
      backHref="/blog"
      backLabel="Volver al sitio"
    >
      <LoginForm />
    </AuthShell>
  );
}
