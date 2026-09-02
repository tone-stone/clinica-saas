import type { ScaleType } from "@/lib/supabase/database.types";

export interface ScaleDefinition {
  type: ScaleType;
  name: string;
  instructions: string;
  options: { value: number; label: string }[];
  questions: string[];
  maxScore: number;
  /** Índice (0-based) del ítem que es una bandera de riesgo (ideación suicida en PHQ-9). */
  riskItemIndex?: number;
  severityBands: { max: number; label: string }[];
}

const RESPONSE_OPTIONS = [
  { value: 0, label: "Nunca" },
  { value: 1, label: "Varios días" },
  { value: 2, label: "Más de la mitad de los días" },
  { value: 3, label: "Casi todos los días" },
];

export const SCALES: Record<ScaleType, ScaleDefinition> = {
  phq9: {
    type: "phq9",
    name: "PHQ-9 (depresión)",
    instructions: "En las últimas 2 semanas, ¿qué tan seguido le han molestado los siguientes problemas?",
    options: RESPONSE_OPTIONS,
    questions: [
      "Poco interés o placer en hacer las cosas",
      "Se ha sentido decaído(a), deprimido(a) o sin esperanzas",
      "Dificultad para conciliar o mantener el sueño, o dormir demasiado",
      "Se ha sentido cansado(a) o con poca energía",
      "Poco apetito o comer en exceso",
      "Se ha sentido mal con usted mismo(a) — o que es un fracaso o que decepcionó a su familia",
      "Dificultad para concentrarse (leer, ver televisión)",
      "Se ha movido o hablado tan lento que otros lo notaron, o lo contrario: muy inquieto(a)",
      "Pensamientos de que estaría mejor muerto(a) o de hacerse daño de alguna forma",
    ],
    maxScore: 27,
    riskItemIndex: 8,
    severityBands: [
      { max: 4, label: "Mínima" },
      { max: 9, label: "Leve" },
      { max: 14, label: "Moderada" },
      { max: 19, label: "Moderadamente severa" },
      { max: 27, label: "Severa" },
    ],
  },
  gad7: {
    type: "gad7",
    name: "GAD-7 (ansiedad)",
    instructions: "En las últimas 2 semanas, ¿qué tan seguido le han molestado los siguientes problemas?",
    options: RESPONSE_OPTIONS,
    questions: [
      "Sentirse nervioso(a), ansioso(a) o con los nervios de punta",
      "No poder detener o controlar la preocupación",
      "Preocuparse demasiado por diferentes cosas",
      "Dificultad para relajarse",
      "Estar tan inquieto(a) que es difícil quedarse quieto(a)",
      "Molestarse o irritarse fácilmente",
      "Sentir miedo como si algo terrible fuera a pasar",
    ],
    maxScore: 21,
    severityBands: [
      { max: 4, label: "Mínima" },
      { max: 9, label: "Leve" },
      { max: 14, label: "Moderada" },
      { max: 21, label: "Severa" },
    ],
  },
};

export function severityLabel(scaleType: ScaleType, score: number): string {
  const band = SCALES[scaleType].severityBands.find((b) => score <= b.max);
  return band?.label ?? SCALES[scaleType].severityBands.at(-1)!.label;
}
