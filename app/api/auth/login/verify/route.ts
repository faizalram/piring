import {
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransport,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { db } from "@/lib/server/db";
import { HttpError, route } from "@/lib/server/http";
import { setSession, takeChallenge } from "@/lib/server/session";
import { relyingParty } from "@/lib/server/webauthn";

type CredRow = { id: string; user_id: string; public_key: string; counter: string | number; transports: string };

export const POST = route(async (req: Request) => {
  const response = (await req.json()) as AuthenticationResponseJSON;
  const challenge = await takeChallenge();
  if (!challenge) throw new HttpError(400, "Sign-in timed out. Try again.");

  const sql = db();
  const [cred] = (await sql`select * from credentials where id = ${response.id}`) as CredRow[];
  if (!cred) throw new HttpError(400, "This passkey isn't registered here. Create an account first.");

  const { rpID, origin } = relyingParty(req);
  const result = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: cred.id,
      publicKey: isoBase64URL.toBuffer(cred.public_key),
      counter: Number(cred.counter),
      transports: cred.transports ? (cred.transports.split(",") as AuthenticatorTransport[]) : undefined,
    },
  });
  if (!result.verified) throw new HttpError(400, "Couldn't verify the passkey. Try again.");

  await sql`update credentials set counter = ${result.authenticationInfo.newCounter} where id = ${cred.id}`;
  await setSession(cred.user_id);
  return Response.json({ ok: true });
});
