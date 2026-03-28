import { useState } from "react";
import { saveCredentials } from "@/lib/auth";
import { api } from "@/lib/api";
import { Logo } from "@/components/ui/logo";

interface Props {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    saveCredentials(username, appPassword.replace(/\s/g, ""));
    try {
      await api.budgets.list();
      onLogin();
    } catch {
      setError("Invalid credentials. Please check your username and application password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="phone-frame">
      <div className="flex flex-col h-full justify-center px-6 py-10">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="sketch-field">
            <label className="field-label">Username</label>
            <input
              className="sketch-input"
              type="text"
              placeholder="WordPress username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="sketch-field">
            <label className="field-label">Application Password</label>
            <input
              className="sketch-input"
              type="password"
              placeholder="xxxx xxxx xxxx xxxx"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Generate at WordPress › Users › Profile → Application Passwords
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 sketch-box p-2">{error}</p>
          )}

          <button
            type="submit"
            className="sketch-btn sketch-btn-primary mt-2"
            disabled={loading}
          >
            {loading ? "Connecting…" : "Connect"}
          </button>
        </form>
      </div>
    </div>
  );
}
