import { PatientForm } from "@/components/patient-form";

export default function NewPatientPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Nuevo paciente</h1>
      <div className="mt-6">
        <PatientForm />
      </div>
    </div>
  );
}
