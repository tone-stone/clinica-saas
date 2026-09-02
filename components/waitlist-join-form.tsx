"use client";

import { useActionState, useState } from "react";
import { ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { joinWaitlist, type WaitlistFormState } from "@/lib/actions/waitlist";

const initialState: WaitlistFormState = {};

export function WaitlistJoinForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(joinWaitlist, initialState);

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <ListPlus className="size-4" />
        Unirme a la lista de espera
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lista de espera</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="note">¿Algún horario o profesional que prefieras?</Label>
            <Textarea id="note" name="note" rows={3} placeholder="Opcional" />
          </div>
          <p className="text-xs text-muted-foreground">
            Te contactaremos si se libera un cupo que te convenga.
          </p>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enviando…" : "Unirme"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
