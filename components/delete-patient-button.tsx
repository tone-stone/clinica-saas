"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deletePatient, type DeletePatientState } from "@/lib/actions/patients";

const initialState: DeletePatientState = {};

export function DeletePatientButton({ patientId }: { patientId: string }) {
  const [state, formAction, isPending] = useActionState(deletePatient, initialState);

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2 className="size-4" />
        Eliminar
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar este paciente?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Solo es posible si el paciente no tiene historial
            clínico registrado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {state.error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="id" value={patientId} />
            <AlertDialogAction type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
