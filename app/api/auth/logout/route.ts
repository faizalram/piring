import { route } from "@/lib/server/http";
import { clearSession } from "@/lib/server/session";

export const POST = route(async () => {
  await clearSession();
  return Response.json({ ok: true });
});
