/** Relying party info for passkeys, taken from the domain the request came in on. */
export function relyingParty(req: Request): { rpID: string; origin: string } {
  const h = req.headers;
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? new URL(req.url).host).split(",")[0].trim();
  const hostname = host.split(":")[0];
  const local = hostname === "localhost" || hostname === "127.0.0.1";
  const proto = (h.get("x-forwarded-proto") ?? (local ? "http" : "https")).split(",")[0].trim();
  return { rpID: hostname, origin: `${proto}://${host}` };
}
