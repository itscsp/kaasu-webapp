import { useState, useEffect } from "react";
import { hasPinSetup, loadCredentials, getStoredCredentials, clearPin, clearCredentials } from "@/lib/auth";
import { onSessionExpired } from "@/lib/api";
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
  token: string;
}

export default function App() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [pendingCreds, setPendingCreds] = useState<PendingCreds | null>(null);

  useEffect(() => {
    // Register 401 / session-expired handler
    onSessionExpired(() => {
      clearPin();
      clearCredentials();
      setAuthState("credentials");
    });

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

  function handleCredentialLogin(token: string) {
    setPendingCreds({ token });
    if (hasPinSetup()) {
      // User is logging in with credentials while a PIN is set.
      // This means they are resetting a forgotten PIN, or swapping users.
      // Clear the old PIN blob and force them to set a new PIN.
      clearPin();
    }
    // Always guide through PIN setup for fresh credential logins
    setAuthState("pin-setup");
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
        <LoginPage 
          onLogin={handleCredentialLogin} 
        />
      )}
      {authState === "pin-setup" && pendingCreds && (
        <PinSetupPage
          token={pendingCreds.token}
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
