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
import { signupTenant, type SignupState } from "@/lib/actions/signup";
import { slugifySubdomain } from "@/lib/validation/subdomain";

interface Plan {
  id: string;
  name: string;
  price_cents: number;
  interval: string;
}

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

const initialState: SignupState = {};

export function SignupForm({ plans, defaultPlanId }: { plans: Plan[]; defaultPlanId?: string }) {
  const [state, formAction, isPending] = useActionState(signupTenant, initialState);
  const [subdomain, setSubdomain] = useState("");
  const [planId, setPlanId] = useState(defaultPlanId ?? plans[0]?.id ?? "");

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="clinicName">Nombre de la clínica</Label>
        <Input
          id="clinicName"
          name="clinicName"
          required
          onChange={(e) => setSubdomain((prev) => prev || slugifySubdomain(e.target.value))}
        />
        {state.fieldErrors?.clinicName && (
          <p className="text-sm text-destructive">{state.fieldErrors.clinicName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subdomain">Subdominio</Label>
        <div className="flex items-center gap-2">
          <Input
            id="subdomain"
            name="subdomain"
            required
            value={subdomain}
            onChange={(e) => setSubdomain(slugifySubdomain(e.target.value))}
          />
          <span className="whitespace-nowrap text-sm text-muted-foreground">.{ROOT_DOMAIN}</span>
        </div>
        {state.fieldErrors?.subdomain && (
          <p className="text-sm text-destructive">{state.fieldErrors.subdomain}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ownerFullName">Tu nombre</Label>
        <Input id="ownerFullName" name="ownerFullName" required />
        {state.fieldErrors?.ownerFullName && (
          <p className="text-sm text-destructive">{state.fieldErrors.ownerFullName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ownerEmail">Correo</Label>
        <Input id="ownerEmail" name="ownerEmail" type="email" required />
        {state.fieldErrors?.ownerEmail && (
          <p className="text-sm text-destructive">{state.fieldErrors.ownerEmail}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ownerPassword">Contraseña</Label>
        <Input id="ownerPassword" name="ownerPassword" type="password" required minLength={8} />
        {state.fieldErrors?.ownerPassword && (
          <p className="text-sm text-destructive">{state.fieldErrors.ownerPassword}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="planId">Plan</Label>
        <input type="hidden" name="planId" value={planId} />
        <Select value={planId} onValueChange={(value) => setPlanId(value ?? "")}>
          <SelectTrigger id="planId" className="w-full">
            <SelectValue placeholder="Selecciona un plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name} — ${(plan.price_cents / 100).toLocaleString("es")}/
                {plan.interval === "year" ? "año" : "mes"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.planId && (
          <p className="text-sm text-destructive">{state.fieldErrors.planId}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creando tu clínica…" : "Continuar al pago"}
      </Button>
    </form>
  );
}
