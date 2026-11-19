import { verifyRegistrationResponse, type RegistrationResponseJSON } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { db } from "@/lib/server/db";
import { HttpError, route } from "@/lib/server/http";
import { setSession, takeChallenge } from "@/lib/server/session";
import { relyingParty } from "@/lib/server/webauthn";

export const POST = route(async (req: Request) => {
  const response = (await req.json()) as RegistrationResponseJSON;
  const challenge = await takeChallenge();
  if (!challenge?.userId || !challenge.name) throw new HttpError(400, "Sign-up timed out. Try again.");

  const { rpID, origin } = relyingParty(req);
  const result = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });
  if (!result.verified || !result.registrationInfo) throw new HttpError(400, "Couldn't verify the passkey. Try again.");

  const { credential } = result.registrationInfo;
  const sql = db();
  await sql.transaction([
    sql`insert into users (id, name) values (${challenge.userId}, ${challenge.name})`,
    sql`insert into credentials (id, user_id, public_key, counter, transports)
        values (${credential.id}, ${challenge.userId}, ${isoBase64URL.fromBuffer(credential.publicKey)},
                ${credential.counter}, ${(credential.transports ?? []).join(",")})`,
  ]);
  await setSession(challenge.userId);
  return Response.json({ ok: true });
});
