import { LoginForm } from "@/components/login-form";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/site-header";

export default function RootLoginPage() {
  return (
    <main className="mx-auto flex flex-1 flex-col justify-center px-6 py-16" style={{ maxWidth: 400 }}>
      <div className="flex justify-center">
        <Logo />
      </div>
      <Card className="mt-8 p-8">
        <h1 className="text-center text-xl font-semibold tracking-tight">Panel de administración</h1>
        <div className="mt-8">
          <LoginForm redirectTo="/admin" />
        </div>
      </Card>
    </main>
  );
}
