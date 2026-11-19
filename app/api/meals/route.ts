import { db, loadMeals } from "@/lib/server/db";
import { analyzeMeal } from "@/lib/server/analyze";
import { HttpError, requireUser, route } from "@/lib/server/http";

// Reading a photo can take 5 to 20 seconds
export const maxDuration = 60;

/** Meals between ?from and ?to (ISO times, the browser's local day) */
export const GET = route(async (req: Request) => {
  const userId = await requireUser();
  const url = new URL(req.url);
  const from = new Date(url.searchParams.get("from") ?? "");
  const to = new Date(url.searchParams.get("to") ?? "");
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) throw new HttpError(400, "Pick a day.");

  const rows = (await db()`
    select id from meals
    where user_id = ${userId} and eaten_at >= ${from} and eaten_at < ${to}`) as { id: string }[];
  const meals = await loadMeals(userId, rows.map((r) => r.id));
  return Response.json({ meals });
});

const MAX_IMAGE_CHARS = 4_000_000; // base64, about 3 MB
const MAX_THUMB_CHARS = 120_000;

/** Reads a photo and saves it as a meal */
export const POST = route(async (req: Request) => {
  const userId = await requireUser();
  const { image, thumb, eatenAt } = (await req.json()) as { image?: string; thumb?: string; eatenAt?: string };

  if (typeof image !== "string" || image.length < 100) throw new HttpError(400, "No photo received. Try again.");
  if (image.length > MAX_IMAGE_CHARS) throw new HttpError(413, "That photo is too large. Try again.");
  const eaten = new Date(eatenAt ?? Date.now());
  if (Number.isNaN(eaten.getTime())) throw new HttpError(400, "Invalid time.");
  const thumbUrl = typeof thumb === "string" && thumb.length < MAX_THUMB_CHARS ? `data:image/jpeg;base64,${thumb}` : null;

  const analysis = await analyzeMeal(image);
  if (!analysis.isFood) throw new HttpError(422, "No food or drink found in that photo. Try again with the plate in view.");

  const sql = db();
  const mealId = crypto.randomUUID();
  await sql.transaction([
    sql`insert into meals (id, user_id, eaten_at, name, thumb, model)
        values (${mealId}, ${userId}, ${eaten}, ${analysis.name}, ${thumbUrl}, ${analysis.model})`,
    ...analysis.items.map(
      (it, position) => sql`
        insert into meal_items (meal_id, position, food_id, label, source, confidence, grams, servings, kcal, protein, carbs, fat)
        values (${mealId}, ${position}, ${it.foodId}, ${it.label}, ${it.source}, ${it.confidence}, ${it.grams},
                ${it.servings}, ${it.kcal}, ${it.protein}, ${it.carbs}, ${it.fat})`,
    ),
  ]);

  const [meal] = await loadMeals(userId, [mealId]);
  return Response.json({ meal }, { status: 201 });
});
