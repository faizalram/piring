import { catalogForPrompt, FOOD_BY_ID } from "../foods";
import type { Item } from "../nutrition";
import { env } from "./env";
import { HttpError } from "./http";

export type AnalyzedItem = Omit<Item, "id" | "factor">;
export type Analysis = { isFood: boolean; name: string; items: AnalyzedItem[]; model: string };

const INSTRUCTIONS = `You log meals from phone photos for one person in Jakarta who mostly eats warung and restaurant food.

For every food and drink you can see:
- Pick the closest food_id from the catalog. Use "other" only when nothing fits, and then fill estimate_per_100g.
- Split mixed plates into parts. Nasi padang = nasi_putih + each lauk + gulai_daun_singkong + sambal_hijau + kuah_gulai. Pecel lele = lele_goreng + sambal + lalapan + nasi_putih. Bubur ayam = bubur_nasi + ayam_suwir + toppings.
- grams is the edible amount visible, as served and cooked: no bones, skewers or packaging. For drinks, use ml.
- Judge size from the plate (warung plates are about 22 to 26 cm across), spoons, hands, cups and packaging. The catalog portion is a guide, not the answer.
- Use the fried version for anything fried and the santan version for anything in coconut gravy. Count visible oil, sambal, kecap and kerupuk.
- Count every drink in the photo.
- If the photo shows a nutrition label (Informasi Nilai Gizi), fill label_per_serving and servings for that product.
- confidence is high when you are sure what it is and roughly how much, low when it is partly hidden or unclear.
- meal_name is a short name the person would say, in Indonesian for Indonesian food, for example "Nasi padang ayam pop".
- If there is no food or drink in the photo, set is_food to false and return no items.

Reply with one JSON object and nothing else. This shows the shape only, not this photo:
{
  "is_food": true,
  "meal_name": "Nasi uduk telur balado",
  "items": [
    {"food_id": "nasi_uduk", "label": "Nasi uduk", "grams": 160, "confidence": "high"},
    {"food_id": "telur_balado", "label": "Telur balado", "grams": 65, "confidence": "high"},
    {"food_id": "other", "label": "Kerupuk jangek", "grams": 15, "confidence": "medium",
     "estimate_per_100g": {"kcal": 540, "protein": 60, "carbs": 0, "fat": 33}},
    {"food_id": "other", "label": "Teh botol", "grams": 350, "confidence": "high",
     "label_per_serving": {"kcal": 140, "protein": 0, "carbs": 35, "fat": 0}, "servings": 1}
  ]
}
Only add estimate_per_100g for food_id "other", and only add label_per_serving and servings when a nutrition label is readable.`;

type Macros = { kcal: number; protein: number; carbs: number; fat: number };
type RawItem = {
  food_id?: string;
  label?: string;
  grams?: number;
  confidence?: string;
  estimate_per_100g?: Partial<Macros>;
  label_per_serving?: Partial<Macros>;
  servings?: number;
};
type RawOutput = { is_food?: boolean; meal_name?: string; items?: RawItem[] };

const clamp = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : NaN;
};

function cleanMacros(m: Partial<Macros> | undefined, maxKcal: number): Macros | null {
  if (!m) return null;
  const out = {
    kcal: clamp(m.kcal, 0, maxKcal),
    protein: clamp(m.protein, 0, maxKcal / 4),
    carbs: clamp(m.carbs, 0, maxKcal / 4),
    fat: clamp(m.fat, 0, maxKcal / 9),
  };
  return Object.values(out).some(Number.isNaN) ? null : out;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function toItem(raw: RawItem): AnalyzedItem | null {
  const label = (raw.label ?? "").trim().slice(0, 80);
  const confidence = raw.confidence === "high" || raw.confidence === "low" ? raw.confidence : "medium";
  const grams = clamp(raw.grams, 1, 3000);

  // Packaged food with a readable label: per serving x servings
  const perServing = cleanMacros(raw.label_per_serving, 3000);
  const servings = clamp(raw.servings, 0.1, 20);
  if (perServing && !Number.isNaN(servings)) {
    return {
      foodId: raw.food_id || "label",
      label: label || "Packaged food",
      source: "label",
      confidence,
      grams: Number.isNaN(grams) ? 0 : grams,
      servings,
      kcal: round1(perServing.kcal * servings),
      protein: round1(perServing.protein * servings),
      carbs: round1(perServing.carbs * servings),
      fat: round1(perServing.fat * servings),
    };
  }

  if (Number.isNaN(grams)) return null;
  const k = grams / 100;

  // Known catalog food: the app does the math
  const food = raw.food_id ? FOOD_BY_ID.get(raw.food_id) : undefined;
  if (food) {
    return {
      foodId: food.id,
      label: label || food.name,
      source: "catalog",
      confidence,
      grams,
      servings: null,
      kcal: round1(food.kcal * k),
      protein: round1(food.protein * k),
      carbs: round1(food.carbs * k),
      fat: round1(food.fat * k),
    };
  }

  // Not in the catalog: use the model's own per-100 g estimate, marked as less certain
  const est = cleanMacros(raw.estimate_per_100g, 900);
  if (!est) return null;
  return {
    foodId: "other",
    label: label || "Other",
    source: "estimate",
    confidence: confidence === "high" ? "medium" : confidence,
    grams,
    servings: null,
    kcal: round1(est.kcal * k),
    protein: round1(est.protein * k),
    carbs: round1(est.carbs * k),
    fat: round1(est.fat * k),
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Seconds until the provider lets us try again, from its rate-limit headers */
function retryAfterSeconds(res: Response): number {
  const ra = Number(res.headers.get("retry-after"));
  if (Number.isFinite(ra) && ra > 0) return Math.ceil(ra);
  // Groq also sends e.g. "7.66s" or "1m30s" for the token window
  const reset = res.headers.get("x-ratelimit-reset-tokens") ?? "";
  const m = /(?:(\d+)m)?([\d.]+)s/.exec(reset);
  if (m) return Math.ceil(Number(m[1] ?? 0) * 60 + Number(m[2]));
  return 60;
}

function waitText(sec: number): string {
  return sec < 90 ? `${sec} seconds` : `${Math.ceil(sec / 60)} minutes`;
}

/** Pulls the first JSON object out of the reply, tolerating ```json fences or stray text */
function parseJson(text: string): RawOutput | null {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as RawOutput;
  } catch {
    return null;
  }
}

/**
 * Sends the photo to an open-weight vision model through any OpenAI-compatible API.
 * Default: Qwen 3.8 27B on Groq's free tier. Change AI_BASE_URL / AI_MODEL to switch provider.
 */
export async function analyzeMeal(imageBase64: string): Promise<Analysis> {
  const baseUrl = (process.env.AI_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, "");
  const model = process.env.AI_MODEL || "qwen/qwen3.8-27b";
  const isGroq = baseUrl.includes("groq.com");

  const body = JSON.stringify({
    model,
    temperature: 0.2,
    top_p: 0.8,
    max_completion_tokens: 2000,
    response_format: { type: "json_object" },
    // Instruct mode: no reasoning tokens, which keeps it fast and inside the free per-minute token limit
    ...(isGroq ? { reasoning_effort: "none" } : {}),
    messages: [
      { role: "system", content: `${INSTRUCTIONS}\n\nCatalog (id | name | typical portion):\n${catalogForPrompt()}` },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          { type: "text", text: "Log this meal. Reply with the JSON object only." },
        ],
      },
    ],
  });

  const call = () =>
    fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${env("AI_API_KEY")}` },
      body,
    });

  let res = await call();
  // Free tiers allow only so many tokens per minute: wait once if it's a short wait
  if (res.status === 429) {
    const wait = retryAfterSeconds(res);
    if (wait <= 20) {
      await sleep(wait * 1000 + 500);
      res = await call();
    }
  }

  if (!res.ok) {
    const detail = await res.text();
    console.error("ai error", res.status, detail);
    if (res.status === 401 || res.status === 403) throw new HttpError(500, "The AI_API_KEY in Vercel isn't valid.");
    if (res.status === 429) {
      throw new HttpError(503, `The free AI limit is used up for now. Try again in ${waitText(retryAfterSeconds(res))}.`);
    }
    if (res.status === 404 || /model/i.test(detail)) throw new HttpError(500, `The model "${model}" isn't available. Check AI_MODEL in Vercel.`);
    throw new HttpError(502, "Couldn't read the photo. Try again.");
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
  const out = parseJson(data.choices?.[0]?.message?.content ?? "");
  if (!out) throw new HttpError(502, "Couldn't read the photo. Try again.");

  const items = (out.items ?? []).map(toItem).filter((i): i is AnalyzedItem => i !== null);
  return {
    isFood: out.is_food !== false && items.length > 0,
    name: (out.meal_name ?? "").trim().slice(0, 80) || "Meal",
    items,
    model,
  };
}
