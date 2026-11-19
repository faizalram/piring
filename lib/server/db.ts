import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { Item, Meal } from "../nutrition";
import { env } from "./env";

let client: NeonQueryFunction<false, false> | null = null;

/** Tagged-template SQL client. Usage: await db()`select * from meals where id = ${id}` */
export function db(): NeonQueryFunction<false, false> {
  if (!client) client = neon(process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? env("DATABASE_URL"));
  return client;
}

export type MealRow = { id: string; name: string; eaten_at: Date | string; thumb: string | null };
export type ItemRow = {
  id: string;
  meal_id: string;
  food_id: string;
  label: string;
  source: Item["source"];
  confidence: Item["confidence"];
  grams: number;
  servings: number | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  factor: number;
};

export function toItem(r: ItemRow): Item {
  return {
    id: r.id,
    foodId: r.food_id,
    label: r.label,
    source: r.source,
    confidence: r.confidence,
    grams: Number(r.grams),
    servings: r.servings === null ? null : Number(r.servings),
    kcal: Number(r.kcal),
    protein: Number(r.protein),
    carbs: Number(r.carbs),
    fat: Number(r.fat),
    factor: Number(r.factor),
  };
}

export function toMeal(r: MealRow, items: ItemRow[]): Meal {
  return {
    id: r.id,
    name: r.name,
    eatenAt: (r.eaten_at instanceof Date ? r.eaten_at : new Date(r.eaten_at)).toISOString(),
    thumb: r.thumb,
    items: items.filter((i) => i.meal_id === r.id).map(toItem),
  };
}

/** Loads meals with their items, scoped to the user. */
export async function loadMeals(userId: string, mealIds: string[]): Promise<Meal[]> {
  if (mealIds.length === 0) return [];
  const sql = db();
  const meals = (await sql`
    select id, name, eaten_at, thumb from meals
    where user_id = ${userId} and id = any(${mealIds}::uuid[])
    order by eaten_at asc`) as MealRow[];
  const items = (await sql`
    select * from meal_items
    where meal_id = any(${meals.map((m) => m.id)}::uuid[])
    order by position asc`) as ItemRow[];
  return meals.map((m) => toMeal(m, items));
}
