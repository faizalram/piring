import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";

const SESSION_COOKIE = "nm_session";
const CHALLENGE_COOKIE = "nm_challenge";
const YEAR = 365 * 24 * 60 * 60;

function mac(payload: string) {
  return createHmac("sha256", env("SESSION_SECRET")).update(payload).digest("base64url");
}

function sign(data: object): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${mac(payload)}`;
}

function unsign<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(mac(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

const cookieBase = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
});

export async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sign({ u: userId, e: Date.now() + YEAR * 1000 }), { ...cookieBase(), maxAge: YEAR });
}

export async function getUserId(): Promise<string | null> {
  const jar = await cookies();
  const data = unsign<{ u: string; e: number }>(jar.get(SESSION_COOKIE)?.value);
  if (!data || data.e < Date.now()) return null;
  return data.u;
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export type Challenge = { challenge: string; userId?: string; name?: string };

export async function setChallenge(data: Challenge) {
  const jar = await cookies();
  jar.set(CHALLENGE_COOKIE, sign({ ...data, e: Date.now() + 5 * 60 * 1000 }), { ...cookieBase(), maxAge: 300 });
}

export async function takeChallenge(): Promise<Challenge | null> {
  const jar = await cookies();
  const data = unsign<Challenge & { e: number }>(jar.get(CHALLENGE_COOKIE)?.value);
  jar.delete(CHALLENGE_COOKIE);
  if (!data || data.e < Date.now()) return null;
  return data;
}
