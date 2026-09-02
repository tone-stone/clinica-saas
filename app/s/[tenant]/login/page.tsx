import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";
import { LoginForm } from "@/components/login-form";
import { Card } from "@/components/ui/card";

export default async function TenantLoginPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);

  return (
    <main className="mx-auto flex flex-1 flex-col justify-center px-6 py-16" style={{ maxWidth: 400 }}>
      <Card className="p-8">
        <h1 className="text-center text-xl font-semibold tracking-tight">
          {tenant?.name ?? "Iniciar sesión"}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Ingresa a tu cuenta</p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </Card>
    </main>
  );
}
