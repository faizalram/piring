// Prints fresh secrets for Vercel > Settings > Environment Variables.
import { randomBytes } from "node:crypto";

console.log(`SESSION_SECRET=${randomBytes(32).toString("base64url")}
INVITE_CODE=${randomBytes(4).toString("hex")}`);
