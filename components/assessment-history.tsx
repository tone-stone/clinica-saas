import { SCALES, severityLabel } from "@/lib/assessments/scales";
import type { ScaleType } from "@/lib/supabase/database.types";

interface AssessmentRow {
  id: string;
  scale_type: ScaleType;
  score: number;
  created_at: string;
}

function Sparkline({ points, max }: { points: number[]; max: number }) {
  if (points.length < 2) return null;
  const w = 200;
  const h = 48;
  const pad = 4;
  const stepX = (w - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (p / max) * (h - pad * 2);
    return { x, y };
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full" preserveAspectRatio="none">
      <polyline
        points={coords.map((c) => `${c.x},${c.y}`).join(" ")}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="3" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />
      ))}
    </svg>
  );
}

export function AssessmentHistory({ assessments }: { assessments: AssessmentRow[] }) {
  const byType = new Map<ScaleType, AssessmentRow[]>();
  for (const a of assessments) {
    const list = byType.get(a.scale_type) ?? [];
    list.push(a);
    byType.set(a.scale_type, list);
  }

  if (byType.size === 0) {
    return <p className="text-sm text-muted-foreground">Sin escalas aplicadas todavía.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[...byType.entries()].map(([type, rows]) => {
        const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
        const latest = sorted.at(-1)!;
        return (
          <div key={type} className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{SCALES[type].name}</p>
              <span className="text-lg font-semibold tabular-nums">
                {latest.score}
                <span className="text-xs font-normal text-muted-foreground">
                  /{SCALES[type].maxScore}
                </span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {severityLabel(type, latest.score)} · {new Date(latest.created_at).toLocaleDateString("es")}
            </p>
            {sorted.length > 1 && (
              <div className="mt-2">
                <Sparkline points={sorted.map((r) => r.score)} max={SCALES[type].maxScore} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
