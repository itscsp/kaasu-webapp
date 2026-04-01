import { useState } from "react";
import { saveCredentials } from "@/lib/auth";
import { api } from "@/lib/api";
import { Logo } from "@/components/ui/logo";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

interface Props {
  onLogin: (token: string) => void;
  onNavigateToRegister: () => void;
}

export default function LoginPage({ onLogin, onNavigateToRegister }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      if (res.success && res.token) {
        saveCredentials(res.token);
        onLogin(res.token);
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.googleSignIn(credentialResponse.credential);
      if (res.success && res.token) {
        saveCredentials(res.token);
        onLogin(res.token);
      } else {
        setError("Failed to authenticate with Google.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect with Google.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="phone-frame">
      <div className="flex flex-col h-full justify-center px-6 py-10 gap-6">
        <div className="flex justify-center mb-2">
          <Logo />
        </div>
        
        <div className="text-center">
          <h1 className="sketch-title text-xl mb-1">Welcome Back</h1>
          <p className="text-slate-500 text-xs">
            Sign in to access your Budget Tracker
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-600 sketch-box p-3 text-center bg-red-50/50">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="sketch-field">
            <label className="field-label">Email</label>
            <input
              className="sketch-input"
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="sketch-field">
            <label className="field-label">Password</label>
            <input
              className="sketch-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="sketch-btn sketch-btn-primary mt-2"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>

        <div className="flex items-center justify-center gap-2">
          <span className="h-px w-full bg-slate-200"></span>
          <span className="text-[10px] text-slate-400 font-bold uppercase px-2">OR</span>
          <span className="h-px w-full bg-slate-200"></span>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google Login Failed")}
          />
        </div>

        <button
          type="button"
          onClick={onNavigateToRegister}
          className="text-xs text-slate-500 hover:text-slate-800 transition-colors mt-2"
        >
          Don't have an account? <span className="font-bold underline">Register</span>
        </button>
      </div>
    </div>
  );
}
