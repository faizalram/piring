"use client";

import { useState, type FormEvent } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { api, errorMessage } from "@/lib/client";
import PlateRing from "./PlateRing";

export default function Auth({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [invite, setInvite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      const optionsJSON = await api<Parameters<typeof startAuthentication>[0]["optionsJSON"]>("/api/auth/login/options", {
        method: "POST",
      });
      const response = await startAuthentication({ optionsJSON });
      await api("/api/auth/login/verify", { method: "POST", body: JSON.stringify(response) });
      onSignedIn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function signUp(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const optionsJSON = await api<Parameters<typeof startRegistration>[0]["optionsJSON"]>("/api/auth/register/options", {
        method: "POST",
        body: JSON.stringify({ name, invite }),
      });
      const response = await startRegistration({ optionsJSON });
      await api("/api/auth/register/verify", { method: "POST", body: JSON.stringify(response) });
      onSignedIn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <h1 className="wordmark wordmark-lg">Piring</h1>
      <p className="intro">Photograph what you’re about to eat. Piring reads the plate and logs the calories, protein, carbs and fat.</p>

      <div className="day demo" aria-hidden="true">
        <PlateRing totals={{ kcal: 712, protein: 31, carbs: 82, fat: 28 }} size={132} />
        <p className="demo-caption">
          Nasi padang ayam pop
          <span>Nasi, ayam pop, daun singkong, sambal hijau, kuah gulai</span>
        </p>
      </div>

      {mode === "signin" ? (
        <div className="form">
          <button className="btn btn-snap" onClick={signIn} disabled={busy}>
            Sign in with passkey
          </button>
          <p className="small muted">
            New here?{" "}
            <button
              className="link"
              onClick={() => {
                setMode("signup");
                setError("");
              }}
            >
              Create an account
            </button>
          </p>
        </div>
      ) : (
        <form className="form" onSubmit={signUp}>
          <label>
            Your name
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="nickname" required />
          </label>
          <label>
            Invite code
            <input
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              required
            />
          </label>
          <button className="btn btn-snap" type="submit" disabled={busy}>
            Create passkey
          </button>
          <p className="small muted">
            Uses Face ID or Touch ID, no password.{" "}
            <button
              type="button"
              className="link"
              onClick={() => {
                setMode("signin");
                setError("");
              }}
            >
              I already have an account
            </button>
          </p>
        </form>
      )}

      {error && <p className="error">{error}</p>}
    </main>
  );
}
