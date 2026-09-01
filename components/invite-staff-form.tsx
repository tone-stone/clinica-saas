"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteStaffMember, type InviteState } from "@/lib/actions/team";

const initialState: InviteState = {};

export function InviteStaffForm() {
  const [state, formAction, isPending] = useActionState(inviteStaffMember, initialState);
  const [staffRole, setStaffRole] = useState("doctor");

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <input type="hidden" name="staffRole" value={staffRole} />

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre</Label>
        <Input id="fullName" name="fullName" required />
        {state.fieldErrors?.fullName && (
          <p className="text-sm text-destructive">{state.fieldErrors.fullName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" required />
        {state.fieldErrors?.email && (
          <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Rol</Label>
        <Select value={staffRole} onValueChange={(value) => setStaffRole(value ?? "doctor")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="doctor">Doctor/a</SelectItem>
            <SelectItem value="psicologo">Psicólogo/a</SelectItem>
            <SelectItem value="recepcion">Recepción</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Invitando…" : "Invitar"}
      </Button>
    </form>
  );
}
