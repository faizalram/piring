import { getUserId } from "./session";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Wraps a route handler so errors come back as JSON { error }. */
export function route<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
      console.error(e);
      const message = e instanceof Error ? e.message : "Server error";
      return Response.json({ error: message }, { status: 500 });
    }
  };
}

export async function requireUser(): Promise<string> {
  const id = await getUserId();
  if (!id) throw new HttpError(401, "Sign in first.");
  return id;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(s: unknown): s is string {
  return typeof s === "string" && UUID.test(s);
}
