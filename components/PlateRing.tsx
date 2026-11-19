import { kcal as fmtKcal } from "@/lib/format";
import type { Totals } from "@/lib/nutrition";

const SIZE = 176;
const C = SIZE / 2;
const R = 64;
const STROKE = 14;
const CIRC = 2 * Math.PI * R;

/**
 * The day drawn as a plate: total kcal in the middle, ringed by where the energy came from
 * (protein and carbs at 4 kcal/g, fat at 9 kcal/g).
 */
export default function PlateRing({ totals, size = SIZE }: { totals: Totals; size?: number }) {
  const parts = [
    { key: "protein", value: totals.protein * 4, color: "var(--protein)" },
    { key: "carbs", value: totals.carbs * 4, color: "var(--carbs)" },
    { key: "fat", value: totals.fat * 9, color: "var(--fat)" },
  ];
  const sum = parts.reduce((s, p) => s + p.value, 0);
  const gap = sum > 0 && parts.filter((p) => p.value > 0).length > 1 ? 3 : 0;

  let offset = 0;
  const arcs = parts
    .filter((p) => p.value > 0)
    .map((p) => {
      const len = (p.value / sum) * CIRC;
      const arc = { ...p, dash: Math.max(len - gap, 0), offset };
      offset += len;
      return arc;
    });

  const label = `${fmtKcal(totals.kcal)} kcal: ${Math.round(totals.protein)} g protein, ${Math.round(totals.carbs)} g carbs, ${Math.round(totals.fat)} g fat`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={label} className="plate">
      <circle cx={C} cy={C} r={C - 2} className="plate-rim" />
      <circle cx={C} cy={C} r={R} fill="none" stroke="var(--line)" strokeWidth={STROKE} />
      <g transform={`rotate(-90 ${C} ${C})`}>
        {arcs.map((a) => (
          <circle
            key={a.key}
            cx={C}
            cy={C}
            r={R}
            fill="none"
            stroke={a.color}
            strokeWidth={STROKE}
            strokeDasharray={`${a.dash} ${CIRC - a.dash}`}
            strokeDashoffset={-a.offset}
          />
        ))}
      </g>
      <text x={C} y={C + 2} textAnchor="middle" className="plate-kcal">
        {fmtKcal(totals.kcal)}
      </text>
      <text x={C} y={C + 24} textAnchor="middle" className="plate-unit">
        kcal
      </text>
    </svg>
  );
}
