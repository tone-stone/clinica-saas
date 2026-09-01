"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPatient, type PatientFormState } from "@/lib/actions/patients";

const initialState: PatientFormState = {};

export function PatientForm() {
  const [state, formAction, isPending] = useActionState(createPatient, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input id="fullName" name="fullName" required />
        {state.fieldErrors?.fullName && (
          <p className="text-sm text-destructive">{state.fieldErrors.fullName}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Fecha de nacimiento</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Género</Label>
          <Input id="gender" name="gender" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" name="address" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="emergencyContactName">Contacto de emergencia</Label>
          <Input id="emergencyContactName" name="emergencyContactName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContactPhone">Teléfono de emergencia</Label>
          <Input id="emergencyContactPhone" name="emergencyContactPhone" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando…" : "Guardar paciente"}
      </Button>
    </form>
  );
}
