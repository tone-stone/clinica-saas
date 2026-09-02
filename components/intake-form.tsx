"use client";

import { useActionState, useState } from "react";
import { NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveIntake, type IntakeFormState } from "@/lib/actions/intake";

const initialState: IntakeFormState = {};

const SEVERIDAD_OPTIONS = { leve: "Leve", moderada: "Moderada", severa: "Severa" };

export function IntakeForm({
  appointmentId,
  defaultMotivo,
  defaultSintomas,
  defaultSeveridad,
}: {
  appointmentId: string;
  defaultMotivo?: string | null;
  defaultSintomas?: string | null;
  defaultSeveridad?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(saveIntake, initialState);

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <NotebookPen className="size-4" />
        {defaultMotivo || defaultSintomas ? "Editar contexto" : "Contarnos antes de tu cita"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Antes de tu cita</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="appointmentId" value={appointmentId} />

          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo de la consulta</Label>
            <Input id="motivo" name="motivo" defaultValue={defaultMotivo ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sintomas">¿Qué síntomas o molestias tienes?</Label>
            <Textarea id="sintomas" name="sintomas" rows={3} defaultValue={defaultSintomas ?? ""} />
          </div>
          <div className="space-y-2">
            <Label>¿Qué tanto te afecta?</Label>
            <Select items={SEVERIDAD_OPTIONS} name="severidad" defaultValue={defaultSeveridad ?? undefined}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SEVERIDAD_OPTIONS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
