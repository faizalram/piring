import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { route } from "@/lib/server/http";
import { setChallenge } from "@/lib/server/session";
import { relyingParty } from "@/lib/server/webauthn";

export const POST = route(async (req: Request) => {
  const { rpID } = relyingParty(req);
  const options = await generateAuthenticationOptions({ rpID, userVerification: "preferred" });
  await setChallenge({ challenge: options.challenge });
  return Response.json(options);
});
