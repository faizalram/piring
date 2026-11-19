"use client";

import { useState } from "react";
import { grams as fmtG, kcal as fmtKcal, timeLabel } from "@/lib/format";
import { FACTORS, FACTOR_LABEL, itemTotals, mealFactor, mealTotals, type Item, type Meal } from "@/lib/nutrition";

function FactorChips({
  value,
  onPick,
  label,
}: {
  value: number | null;
  onPick: (f: number) => void;
  label: string;
}) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {FACTORS.map((f) => (
        <button
          key={f}
          type="button"
          className="chip"
          aria-pressed={value === f}
          onClick={() => onPick(f)}
        >
          {FACTOR_LABEL[f]}
        </button>
      ))}
    </div>
  );
}

function amount(i: Item): string {
  if (i.source === "label" && i.servings) {
    const s = Math.round(i.servings * i.factor * 10) / 10;
    return `${s} serving${s === 1 ? "" : "s"}`;
  }
  return `~${fmtG(i.grams * i.factor)}`;
}

export default function MealRow({
  meal,
  onMealFactor,
  onItemFactor,
  onDelete,
}: {
  meal: Meal;
  onMealFactor: (meal: Meal, f: number) => void;
  onItemFactor: (meal: Meal, item: Item, f: number) => void;
  onDelete: (meal: Meal) => void;
}) {
  const [open, setOpen] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const t = mealTotals(meal);

  return (
    <li className="meal">
      <button type="button" className="meal-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {meal.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="thumb" src={meal.thumb} alt="" width={52} height={52} />
        ) : (
          <span className="thumb thumb-empty" aria-hidden="true" />
        )}
        <span className="meal-main">
          <span className="meal-name">{meal.name}</span>
          <span className="meal-sub">
            {timeLabel(meal.eatenAt)}, P {Math.round(t.protein)} g, C {Math.round(t.carbs)} g, F {Math.round(t.fat)} g
          </span>
        </span>
        <span className="meal-kcal">
          {fmtKcal(t.kcal)}
          <small>kcal</small>
        </span>
      </button>

      <FactorChips value={mealFactor(meal)} onPick={(f) => onMealFactor(meal, f)} label={`Portion of ${meal.name}`} />

      {open && (
        <div className="meal-detail">
          <ul className="items">
            {meal.items.map((i) => {
              const it = itemTotals(i);
              const itemOpen = openItem === i.id;
              return (
                <li key={i.id} className="item">
                  <button
                    type="button"
                    className="item-head"
                    aria-expanded={itemOpen}
                    onClick={() => setOpenItem(itemOpen ? null : i.id)}
                  >
                    <span className="item-name">
                      {i.label}
                      {i.confidence === "low" && <span className="unsure"> (unsure)</span>}
                    </span>
                    <span className="item-amount">{amount(i)}</span>
                    <span className="item-kcal">{fmtKcal(it.kcal)}</span>
                  </button>
                  {itemOpen && (
                    <FactorChips value={i.factor} onPick={(f) => onItemFactor(meal, i, f)} label={`Portion of ${i.label}`} />
                  )}
                </li>
              );
            })}
          </ul>
          <button type="button" className="link danger" onClick={() => onDelete(meal)}>
            Delete meal
          </button>
        </div>
      )}
    </li>
  );
}
