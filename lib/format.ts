export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** "Today", "Yesterday", "Sat 14 Nov" */
export function dayLabel(day: Date, now: Date = new Date()): string {
  const diff = Math.round((startOfDay(now).getTime() - startOfDay(day).getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return day.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function timeLabel(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function kcal(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function grams(n: number): string {
  return `${Math.round(n)} g`;
}
