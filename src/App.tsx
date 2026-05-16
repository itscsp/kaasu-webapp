import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { loadCredentials, clearCredentials, saveCredentials } from "@/lib/auth";
import { onSessionExpired } from "@/lib/api";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import HomePage from "@/pages/HomePage";

type AuthState =
  | "loading"
  | "credentials"   // no credentials at all → show login form
  | "home";         // authenticated

export default function App() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // Register 401 / session-expired handler
    onSessionExpired(() => {
      clearCredentials();
      setAuthState("credentials");
    });

    if (loadCredentials()) {
      setAuthState("home");
    } else {
      setAuthState("credentials");
    }
  }, []);

  // ── Handlers ──

  function handleCredentialLogin(token: string) {
    saveCredentials(token);
    setAuthState("home");
  }

  function handleLogout() {
    clearCredentials();
    setAuthState("credentials");
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
    <BrowserRouter>
      <div className="app-shell">
        {authState === "credentials" && (
          isRegistering ? (
            <RegisterPage 
              onBack={() => setIsRegistering(false)}
              onLoginSuccess={handleCredentialLogin}
            />
          ) : (
            <LoginPage 
              onLogin={handleCredentialLogin} 
              onNavigateToRegister={() => setIsRegistering(true)}
            />
          )
        )}
        {authState === "home" && (
          <HomePage onLogout={handleLogout} />
        )}
      </div>
    </BrowserRouter>
  );
}
