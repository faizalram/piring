import { db, loadMeals } from "@/lib/server/db";
import { HttpError, isUuid, requireUser, route } from "@/lib/server/http";
import { FACTORS } from "@/lib/nutrition";

type Ctx = { params: Promise<{ id: string }> };

/** Scales one item: { factor: 0.5 | 1 | 1.5 | 2 } */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const userId = await requireUser();
  const { id } = await ctx.params;
  if (!isUuid(id)) throw new HttpError(404, "Item not found.");
  const { factor } = (await req.json()) as { factor?: number };
  if (!FACTORS.includes(factor as (typeof FACTORS)[number])) throw new HttpError(400, "Pick ½×, 1×, 1½× or 2×.");

  const [row] = (await db()`
    update meal_items set factor = ${factor}
    where id = ${id} and meal_id in (select id from meals where user_id = ${userId})
    returning meal_id`) as { meal_id: string }[];
  if (!row) throw new HttpError(404, "Item not found.");
  const [meal] = await loadMeals(userId, [row.meal_id]);
  return Response.json({ meal });
});
