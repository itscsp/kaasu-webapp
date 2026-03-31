import { useState } from "react";
import { saveCredentials } from "@/lib/auth";
import { api } from "@/lib/api";
import { Logo } from "@/components/ui/logo";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

interface Props {
  onLogin: (token: string) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.googleSignIn(credentialResponse.credential);
      if (res.success && res.user) {
        saveCredentials(credentialResponse.credential);
        await api.budgets.list();
        onLogin(credentialResponse.credential);
      } else {
        setError("Failed to authenticate with Google.");
      }
    } catch {
      setError("Failed to connect with WordPress backend. Are you using the correct Client ID and Token?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="phone-frame">
      <div className="flex flex-col h-full justify-center px-6 py-10 gap-8">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        
        <div className="text-center">
          <h1 className="sketch-title text-xl mb-2">Welcome Back</h1>
          <p className="text-slate-500 text-sm">
            Sign in with Google to access your Budget Tracker
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 sketch-box p-3 text-center bg-red-50/50">{error}</p>
        )}

        {loading ? (
          <div className="flex justify-center p-4">
            <span className="text-sm text-slate-400 font-medium animate-pulse">Connecting to Kaasu...</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Login Failed and was canceled")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
