"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPatient, updatePatient, type PatientFormState } from "@/lib/actions/patients";
import type { Database } from "@/lib/supabase/database.types";

type Patient = Database["public"]["Tables"]["patients"]["Row"];

const initialState: PatientFormState = {};

export function PatientForm({ patient }: { patient?: Patient }) {
  const action = patient ? updatePatient : createPatient;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {patient && <input type="hidden" name="id" value={patient.id} />}

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input id="fullName" name="fullName" required defaultValue={patient?.full_name} />
        {state.fieldErrors?.fullName && (
          <p className="text-sm text-destructive">{state.fieldErrors.fullName}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" defaultValue={patient?.email ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" defaultValue={patient?.phone ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Fecha de nacimiento</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            defaultValue={patient?.date_of_birth ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Género</Label>
          <Input id="gender" name="gender" defaultValue={patient?.gender ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" name="address" defaultValue={patient?.address ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="emergencyContactName">Contacto de emergencia</Label>
          <Input
            id="emergencyContactName"
            name="emergencyContactName"
            defaultValue={patient?.emergency_contact_name ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContactPhone">Teléfono de emergencia</Label>
          <Input
            id="emergencyContactPhone"
            name="emergencyContactPhone"
            defaultValue={patient?.emergency_contact_phone ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={patient?.notes ?? ""} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando…" : patient ? "Guardar cambios" : "Guardar paciente"}
      </Button>
    </form>
  );
}
