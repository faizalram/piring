import { db, loadMeals } from "@/lib/server/db";
import { HttpError, isUuid, requireUser, route } from "@/lib/server/http";
import { FACTORS } from "@/lib/nutrition";

type Ctx = { params: Promise<{ id: string }> };

/** Scales the whole meal: { factor: 0.5 | 1 | 1.5 | 2 } */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const userId = await requireUser();
  const { id } = await ctx.params;
  if (!isUuid(id)) throw new HttpError(404, "Meal not found.");
  const { factor } = (await req.json()) as { factor?: number };
  if (!FACTORS.includes(factor as (typeof FACTORS)[number])) throw new HttpError(400, "Pick ½×, 1×, 1½× or 2×.");

  await db()`
    update meal_items set factor = ${factor}
    where meal_id = ${id} and meal_id in (select id from meals where user_id = ${userId})`;
  const [meal] = await loadMeals(userId, [id]);
  if (!meal) throw new HttpError(404, "Meal not found.");
  return Response.json({ meal });
});

export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const userId = await requireUser();
  const { id } = await ctx.params;
  if (!isUuid(id)) throw new HttpError(404, "Meal not found.");
  await db()`delete from meals where id = ${id} and user_id = ${userId}`;
  return Response.json({ ok: true });
});
