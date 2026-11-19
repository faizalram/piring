"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { api, ApiError, errorMessage, preparePhoto } from "@/lib/client";
import { addDays, dayLabel, grams, sameDay, startOfDay } from "@/lib/format";
import { dayTotals, type Item, type Meal } from "@/lib/nutrition";
import Auth from "./Auth";
import MealRow from "./MealRow";
import PlateRing from "./PlateRing";

type Phase = "loading" | "auth" | "ready" | "error";
type Me = { user: { id: string; name: string } };

export default function App() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [me, setMe] = useState<Me | null>(null);
  const [fatal, setFatal] = useState("");

  const loadMe = useCallback(async () => {
    try {
      setMe(await api<Me>("/api/me"));
      setPhase("ready");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setPhase("auth");
      else {
        setFatal(errorMessage(e));
        setPhase("error");
      }
    }
  }, []);

  const signedOut = useCallback(() => {
    setMe(null);
    setPhase("auth");
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  if (phase === "auth") return <Auth onSignedIn={loadMe} />;
  if (phase === "error")
    return (
      <main className="shell">
        <h1 className="wordmark">Piring</h1>
        <p className="error">{fatal}</p>
        <button className="btn" onClick={loadMe}>
          Try again
        </button>
      </main>
    );
  if (phase === "loading" || !me)
    return (
      <main className="shell">
        <h1 className="wordmark">Piring</h1>
      </main>
    );
  return <Day me={me} onSignedOut={signedOut} />;
}

type Pending = {
  id: string;
  thumb: string;
  status: "reading" | "error";
  error?: string;
  payload: { image: string; thumb: string; eatenAt: string };
};

function Day({ me, onSignedOut }: { me: Me; onSignedOut: () => void }) {
  const [day, setDay] = useState(() => startOfDay(new Date()));
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);
  const [error, setError] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const isToday = sameDay(day, new Date());

  const load = useCallback(
    async (d: Date) => {
      try {
        const q = new URLSearchParams({ from: d.toISOString(), to: addDays(d, 1).toISOString() });
        const r = await api<{ meals: Meal[] }>(`/api/meals?${q}`);
        setMeals(r.meals);
        setLoaded(true);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) onSignedOut();
        else setError(errorMessage(e));
      }
    },
    [onSignedOut],
  );

  useEffect(() => {
    setLoaded(false);
    load(day);
  }, [day, load]);

  // When the app comes back to the foreground: refresh, and roll over to the new day if you were on "Today"
  const followToday = useRef(true);
  useEffect(() => {
    followToday.current = isToday;
  }, [isToday]);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const today = startOfDay(new Date());
      if (followToday.current) setDay((d) => (sameDay(d, today) ? d : today));
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const replaceMeal = (m: Meal) => setMeals((list) => list.map((x) => (x.id === m.id ? m : x)));

  async function send(p: Pending) {
    try {
      const r = await api<{ meal: Meal }>("/api/meals", { method: "POST", body: JSON.stringify(p.payload) });
      setPending((list) => list.filter((x) => x.id !== p.id));
      setMeals((list) => [...list, r.meal].sort((a, b) => a.eatenAt.localeCompare(b.eatenAt)));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return onSignedOut();
      setPending((list) => list.map((x) => (x.id === p.id ? { ...x, status: "error", error: errorMessage(e) } : x)));
    }
  }

  async function onPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    try {
      const { image, thumb } = await preparePhoto(file);
      const p: Pending = {
        id: crypto.randomUUID(),
        thumb: `data:image/jpeg;base64,${thumb}`,
        status: "reading",
        payload: { image, thumb, eatenAt: new Date().toISOString() },
      };
      if (!isToday) setDay(startOfDay(new Date()));
      setPending((list) => [...list, p]);
      send(p);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function retry(p: Pending) {
    const next = { ...p, status: "reading" as const, error: undefined };
    setPending((list) => list.map((x) => (x.id === p.id ? next : x)));
    send(next);
  }

  async function setMealFactor(meal: Meal, factor: number) {
    replaceMeal({ ...meal, items: meal.items.map((i) => ({ ...i, factor })) });
    try {
      const r = await api<{ meal: Meal }>(`/api/meals/${meal.id}`, { method: "PATCH", body: JSON.stringify({ factor }) });
      replaceMeal(r.meal);
    } catch (e) {
      replaceMeal(meal);
      setError(errorMessage(e));
    }
  }

  async function setItemFactor(meal: Meal, item: Item, factor: number) {
    replaceMeal({ ...meal, items: meal.items.map((i) => (i.id === item.id ? { ...i, factor } : i)) });
    try {
      const r = await api<{ meal: Meal }>(`/api/items/${item.id}`, { method: "PATCH", body: JSON.stringify({ factor }) });
      replaceMeal(r.meal);
    } catch (e) {
      replaceMeal(meal);
      setError(errorMessage(e));
    }
  }

  async function deleteMeal(meal: Meal) {
    if (!window.confirm(`Delete "${meal.name}"?`)) return;
    setMeals((list) => list.filter((m) => m.id !== meal.id));
    try {
      await api(`/api/meals/${meal.id}`, { method: "DELETE" });
    } catch (e) {
      setError(errorMessage(e));
      load(day);
    }
  }

  async function signOut() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    onSignedOut();
  }

  const totals = dayTotals(meals);

  return (
    <main className="shell has-bar">
      <header className="top">
        <h1 className="wordmark">Piring</h1>
        <nav className="day-nav" aria-label="Day">
          <button type="button" className="day-step" aria-label="Previous day" onClick={() => setDay((d) => addDays(d, -1))}>
            ‹
          </button>
          <span className="day-label">{dayLabel(day)}</span>
          <button
            type="button"
            className="day-step"
            aria-label="Next day"
            disabled={isToday}
            onClick={() => setDay((d) => addDays(d, 1))}
          >
            ›
          </button>
        </nav>
      </header>

      <section className="day" aria-label="Day total">
        <PlateRing totals={totals} />
        <dl className="macros">
          <div className="macro">
            <dt>
              <span className="dot dot-protein" aria-hidden="true" />
              Protein
            </dt>
            <dd>{grams(totals.protein)}</dd>
          </div>
          <div className="macro">
            <dt>
              <span className="dot dot-carbs" aria-hidden="true" />
              Carbs
            </dt>
            <dd>{grams(totals.carbs)}</dd>
          </div>
          <div className="macro">
            <dt>
              <span className="dot dot-fat" aria-hidden="true" />
              Fat
            </dt>
            <dd>{grams(totals.fat)}</dd>
          </div>
        </dl>
      </section>

      {error && <p className="error">{error}</p>}

      <ul className="meals">
        {meals.map((m) => (
          <MealRow key={m.id} meal={m} onMealFactor={setMealFactor} onItemFactor={setItemFactor} onDelete={deleteMeal} />
        ))}
        {pending.map((p) => (
          <li key={p.id} className="meal pending" aria-live="polite">
            <div className="meal-head">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={`thumb ${p.status === "reading" ? "thumb-reading" : ""}`} src={p.thumb} alt="" width={52} height={52} />
              <span className="meal-main">
                {p.status === "reading" ? (
                  <>
                    <span className="meal-name">Reading your plate</span>
                    <span className="meal-sub">Usually 5 to 15 seconds</span>
                  </>
                ) : (
                  <>
                    <span className="meal-name">Not logged</span>
                    <span className="meal-sub error-text">{p.error}</span>
                  </>
                )}
              </span>
            </div>
            {p.status === "error" && (
              <div className="pending-actions">
                <button type="button" className="chip" onClick={() => retry(p)}>
                  Try again
                </button>
                <button
                  type="button"
                  className="chip"
                  onClick={() => setPending((list) => list.filter((x) => x.id !== p.id))}
                >
                  Discard
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {loaded && meals.length === 0 && pending.length === 0 && (
        <p className="empty">
          {isToday ? "Nothing logged yet today. Snap your next meal before you eat." : "Nothing logged on this day."}
        </p>
      )}

      <footer className="footer">
        Signed in as {me.user.name}.{" "}
        <button type="button" className="link" onClick={signOut}>
          Sign out
        </button>
      </footer>

      <div className="bar">
        <button type="button" className="btn btn-snap" onClick={() => cameraRef.current?.click()}>
          Snap a meal
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => libraryRef.current?.click()}>
          From photos
        </button>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onPhoto} />
        <input ref={libraryRef} type="file" accept="image/*" hidden onChange={onPhoto} />
      </div>
    </main>
  );
}
