"use client";

import { useActionState, useState } from "react";
import { ClipboardList, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createAssessment, type AssessmentFormState } from "@/lib/actions/assessments";
import { SCALES } from "@/lib/assessments/scales";
import { cn } from "@/lib/utils";
import type { ScaleType } from "@/lib/supabase/database.types";

const initialState: AssessmentFormState = {};

export function AssessmentForm({ patientId }: { patientId: string }) {
  const [open, setOpen] = useState(false);
  const [scaleType, setScaleType] = useState<ScaleType>("phq9");
  const [state, formAction, isPending] = useActionState(createAssessment, initialState);
  const [riskFlag, setRiskFlag] = useState(false);
  const scale = SCALES[scaleType];

  // Cierra el diálogo al guardar con éxito. Patrón "ajustar estado durante el
  // render" en vez de un efecto, para no disparar un render en cascada.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) setOpen(false);
  }

  function selectScale(next: ScaleType) {
    setScaleType(next);
    setRiskFlag(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <ClipboardList className="size-4" />
        Aplicar escala
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Aplicar escala clínica</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <input type="hidden" name="patientId" value={patientId} />
          <input type="hidden" name="scaleType" value={scaleType} />

          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="flex gap-2">
            {(Object.keys(SCALES) as ScaleType[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => selectScale(key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  scaleType === key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted"
                )}
              >
                {SCALES[key].name}
              </button>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">{scale.instructions}</p>

          <div className="space-y-4">
            {scale.questions.map((question, i) => (
              <div key={i} className="space-y-1.5">
                <p className="text-sm font-medium">
                  {i + 1}. {question}
                </p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {scale.options.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs has-checked:border-primary has-checked:bg-accent"
                    >
                      <input
                        type="radio"
                        name={`answer_${i}`}
                        value={option.value}
                        required
                        className="size-3.5"
                        onChange={
                          scale.riskItemIndex === i
                            ? (e) => setRiskFlag(Number(e.target.value) > 0)
                            : undefined
                        }
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {riskFlag && (
            <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <TriangleAlert className="size-4 shrink-0" />
              Este ítem señala posible riesgo. Requiere valoración clínica inmediata.
            </p>
          )}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando…" : "Guardar resultado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
