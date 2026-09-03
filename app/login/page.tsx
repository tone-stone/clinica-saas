import { LoginForm } from "@/components/login-form";
import { AuthShell } from "@/components/auth-shell";

export default function RootLoginPage() {
  return (
    <AuthShell
      title="Panel de administración"
      subtitle="Acceso para el equipo de la plataforma. Si administras una clínica, entra desde el subdominio de tu clínica."
    >
      <LoginForm redirectTo="/admin" />
    </AuthShell>
  );
}
