export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Reportes</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Los reportes (citas por profesional, adherencia de pacientes, exportes en PDF/CSV) se
        construyen en la fase 2. La tabla <code>audit_logs</code> y los datos de{" "}
        <code>appointments</code>/<code>clinical_records</code> ya quedan disponibles para
        alimentarlos.
      </p>
    </div>
  );
}
