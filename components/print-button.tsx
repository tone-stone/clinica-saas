"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button size="sm" className="print:hidden" onClick={() => window.print()}>
      <Printer className="size-4" />
      Exportar / Imprimir PDF
    </Button>
  );
}
