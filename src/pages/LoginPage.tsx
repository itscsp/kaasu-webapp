import { useState } from "react";
import { saveCredentials } from "@/lib/auth";
import { api } from "@/lib/api";
import { Logo } from "@/components/ui/logo";

interface Props {
  onLogin: (username: string, appPassword: string) => void;
  onGoToRegister: () => void;
  onGoToForgot: () => void;
}

export default function LoginPage({ onLogin, onGoToRegister, onGoToForgot }: Props) {
  const [username, setUsername] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const cleanPassword = appPassword.replace(/\s/g, "");
    saveCredentials(username, cleanPassword);
    try {
      await api.budgets.list();
      onLogin(username, cleanPassword);
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

          </div>

          {/* Mail hint */}
          <div className="credentials-hint">
            <span>💡</span>
            <span>Get these credentials from your mail</span>
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

          <div className="flex flex-col gap-2 mt-4 text-center">
            <button
              type="button"
              onClick={onGoToRegister}
              className="text-sm text-gray-400 hover:text-black cursor-pointer transition-colors"
            >
              New user? Create an account
            </button>
            <button
              type="button"
              onClick={onGoToForgot}
              className="text-sm text-gray-400 hover:text-black cursor-pointer transition-colors"
            >
              Forgot Application Password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
