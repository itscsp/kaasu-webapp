import { useState, useEffect } from "react";
import { loadCredentials } from "@/lib/auth";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const ok = loadCredentials();
    setLoggedIn(ok);
  }, []);

  if (loggedIn === null) {
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
      {loggedIn ? (
        <HomePage onLogout={() => setLoggedIn(false)} />
      ) : (
        <LoginPage onLogin={() => setLoggedIn(true)} />
      )}
    </div>
  );
}
