"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createClinicalRecord,
  type ClinicalRecordFormState,
} from "@/lib/actions/clinical-records";
import type { ClinicalRecordType } from "@/lib/supabase/database.types";

const initialState: ClinicalRecordFormState = {};

const RECORD_TYPES: { value: ClinicalRecordType; label: string }[] = [
  { value: "general", label: "General" },
  { value: "medicina", label: "Medicina" },
  { value: "psicologia", label: "Psicología" },
];

export function ClinicalRecordForm({ patientId }: { patientId: string }) {
  const [state, formAction, isPending] = useActionState(createClinicalRecord, initialState);
  const [recordType, setRecordType] = useState<ClinicalRecordType>("general");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="patientId" value={patientId} />
      <input type="hidden" name="recordType" value={recordType} />

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select value={recordType} onValueChange={(v) => setRecordType(v as ClinicalRecordType)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RECORD_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Resumen</Label>
        <Textarea id="summary" name="summary" rows={2} required />
        {state.fieldErrors?.summary && (
          <p className="text-sm text-destructive">{state.fieldErrors.summary}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas clínicas</Label>
        <Textarea id="notes" name="notes" rows={5} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="visibleToPatient" className="size-4" />
        Visible para el paciente en su portal
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando…" : "Guardar entrada"}
      </Button>
    </form>
  );
}
