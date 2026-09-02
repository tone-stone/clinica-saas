"use client";

import { useActionState, useState } from "react";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { signConsent, type ConsentFormState } from "@/lib/actions/consents";

const initialState: ConsentFormState = {};

export function ConsentSignDialog({ consentId, title, body }: { consentId: string; title: string; body: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(signConsent, initialState);

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PenLine className="size-4" />
        Revisar y firmar
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm">
          {body}
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="consentId" value={consentId} />

          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="signedName">Escribe tu nombre completo para firmar</Label>
            <Input id="signedName" name="signedName" required placeholder="Tu nombre completo" />
            <p className="text-xs text-muted-foreground">
              Al escribir tu nombre y enviar, confirmas que leíste y aceptas este documento.
            </p>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cerrar</DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Firmando…" : "Firmar y aceptar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
