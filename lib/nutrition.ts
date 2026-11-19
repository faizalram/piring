// Shared between server and browser.

export type Source = "catalog" | "estimate" | "label";

export type Item = {
  id: string;
  foodId: string;
  label: string;
  source: Source;
  confidence: "high" | "medium" | "low";
  grams: number; // at factor 1
  servings: number | null; // packaged food read from a label
  kcal: number; // at factor 1
  protein: number;
  carbs: number;
  fat: number;
  factor: number;
};

export type Meal = {
  id: string;
  name: string;
  eatenAt: string;
  thumb: string | null;
  items: Item[];
};

export type Totals = { kcal: number; protein: number; carbs: number; fat: number };

export const FACTORS = [0.5, 1, 1.5, 2] as const;
export const FACTOR_LABEL: Record<number, string> = { 0.5: "½×", 1: "1×", 1.5: "1½×", 2: "2×" };

export function itemTotals(i: Item): Totals {
  return { kcal: i.kcal * i.factor, protein: i.protein * i.factor, carbs: i.carbs * i.factor, fat: i.fat * i.factor };
}

function add(a: Totals, b: Totals): Totals {
  return { kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat };
}

const ZERO: Totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

export function mealTotals(m: Meal): Totals {
  return m.items.map(itemTotals).reduce(add, ZERO);
}

export function dayTotals(meals: Meal[]): Totals {
  return meals.map(mealTotals).reduce(add, ZERO);
}

/** The factor shared by every item, or null when items differ */
export function mealFactor(m: Meal): number | null {
  if (m.items.length === 0) return 1;
  const f = m.items[0].factor;
  return m.items.every((i) => i.factor === f) ? f : null;
}
