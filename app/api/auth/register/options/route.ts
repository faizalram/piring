import { generateRegistrationOptions } from "@simplewebauthn/server";
import { env } from "@/lib/server/env";
import { HttpError, route } from "@/lib/server/http";
import { setChallenge } from "@/lib/server/session";
import { relyingParty } from "@/lib/server/webauthn";

export const POST = route(async (req: Request) => {
  const { name, invite } = (await req.json()) as { name?: string; invite?: string };
  const cleanName = (name ?? "").trim().slice(0, 60);
  if (!cleanName) throw new HttpError(400, "Enter your name.");
  if ((invite ?? "").trim() !== env("INVITE_CODE")) throw new HttpError(403, "That invite code doesn't match.");

  const { rpID } = relyingParty(req);
  const userId = crypto.randomUUID();
  const options = await generateRegistrationOptions({
    rpName: "Piring",
    rpID,
    userName: cleanName,
    userDisplayName: cleanName,
    userID: new TextEncoder().encode(userId),
    attestationType: "none",
    authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
  });
  await setChallenge({ challenge: options.challenge, userId, name: cleanName });
  return Response.json(options);
});
