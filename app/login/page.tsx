import { LoginForm } from "@/components/login-form";

export default function RootLoginPage() {
  return (
    <main className="mx-auto flex flex-1 flex-col justify-center px-6" style={{ maxWidth: 400 }}>
      <h1 className="text-center text-2xl font-semibold">Panel de administración</h1>
      <div className="mt-8">
        <LoginForm redirectTo="/admin" />
      </div>
    </main>
  );
}
