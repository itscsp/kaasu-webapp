import { useState, useEffect } from "react";
import { hasPinSetup, loadCredentials, getStoredCredentials } from "@/lib/auth";
import LoginPage from "@/pages/LoginPage";
import PinSetupPage from "@/pages/PinSetupPage";
import PinEntryPage from "@/pages/PinEntryPage";
import HomePage from "@/pages/HomePage";

type AuthState =
  | "loading"
  | "credentials"   // no credentials at all → show login form
  | "pin-setup"     // credentials validated, no PIN yet → set PIN
  | "pin-entry"     // PIN exists → enter PIN to decrypt
  | "home";         // authenticated

interface PendingCreds {
  username: string;
  appPassword: string;
}

export default function App() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [pendingCreds, setPendingCreds] = useState<PendingCreds | null>(null);

  useEffect(() => {
    if (hasPinSetup()) {
      // Encrypted blob exists → just ask for PIN
      setAuthState("pin-entry");
    } else if (loadCredentials()) {
      // Plain credentials stored but no PIN yet (edge case: user cleared PIN)
      const creds = getStoredCredentials();
      if (creds) setPendingCreds(creds);
      setAuthState("pin-setup");
    } else {
      setAuthState("credentials");
    }
  }, []);

  // ── Handlers ──

  function handleCredentialLogin(username: string, appPassword: string) {
    setPendingCreds({ username, appPassword });
    if (hasPinSetup()) {
      // PIN already set (returning user who forgot PIN) → skip setup
      setAuthState("home");
    } else {
      // First time → guide through PIN setup
      setAuthState("pin-setup");
    }
  }

  function handlePinSetupComplete() {
    setPendingCreds(null);
    setAuthState("home");
  }

  function handlePinSuccess() {
    setAuthState("home");
  }

  function handleForgotPin() {
    // Go back to credential screen; don't clear the encrypted blob yet
    setAuthState("credentials");
  }

  function handleLogout() {
    // On logout keep the encrypted blob — user can re-enter PIN
    setAuthState("pin-entry");
  }

  // ── Render ──

  if (authState === "loading") {
    return (
      <div className="app-shell">
        <div className="phone-frame">
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">Loading…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {authState === "credentials" && (
        <LoginPage onLogin={handleCredentialLogin} />
      )}
      {authState === "pin-setup" && pendingCreds && (
        <PinSetupPage
          username={pendingCreds.username}
          appPassword={pendingCreds.appPassword}
          onComplete={handlePinSetupComplete}
        />
      )}
      {authState === "pin-entry" && (
        <PinEntryPage
          onSuccess={handlePinSuccess}
          onForgotPin={handleForgotPin}
        />
      )}
      {authState === "home" && (
        <HomePage onLogout={handleLogout} />
      )}
    </div>
  );
}
