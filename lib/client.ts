export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) {
    if (e.name === "NotAllowedError") return "The passkey prompt was closed. Try again.";
    if (e.name === "TypeError" && /fetch|network|load/i.test(e.message)) return "No connection. Check your internet and try again.";
    return e.message;
  }
  return "Something went wrong. Try again.";
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't open that photo. Try a JPEG or take it again."));
    img.src = url;
  });
}

function draw(img: HTMLImageElement, sx: number, sy: number, sw: number, sh: number, w: number, h: number, quality: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't process photos.");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality).split(",")[1];
}

/**
 * Shrinks the photo before upload: about 1,024 px on the long side for the model,
 * and a 160 px square thumbnail for the history. Re-encoding also drops EXIF data such as location.
 */
export async function preparePhoto(file: File): Promise<{ image: string; thumb: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const scale = Math.min(1, 1024 / Math.max(w, h));
    const image = draw(img, 0, 0, w, h, Math.round(w * scale), Math.round(h * scale), 0.82);
    const side = Math.min(w, h);
    const thumb = draw(img, (w - side) / 2, (h - side) / 2, side, side, 160, 160, 0.72);
    return { image, thumb };
  } finally {
    URL.revokeObjectURL(url);
  }
}
