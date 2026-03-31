import { useState } from "react";
import { api } from "@/lib/api";
import { Logo } from "@/components/ui/logo";
import { saveCredentials } from "@/lib/auth";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

interface Props {
  onBack: () => void;
  onLogin: (username: string, appPassword: string) => void;
}

export default function RegisterPage({ onBack, onLogin }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.auth.register({ name, phone, email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to register. Please check your details or try again.");
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
      if (res.success && res.username && res.app_password) {
        saveCredentials(res.username, res.app_password);
        await api.budgets.list();
        onLogin(res.username, res.app_password);
      } else {
        setError("Failed to register with Google.");
      }
    } catch {
      setError("Failed to connect with Google. Ensure you have the correct client ID.");
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

        {success ? (
          <div className="flex flex-col gap-6 text-center">
            <div className="sketch-box p-6 bg-green-50/10 border-green-500/30">
              <h2 className="text-xl font-bold mb-4">Registration Successful!</h2>
              <p className="text-gray-500 mb-4 whitespace-pre-wrap text-sm">
                We've sent a magic link to your email. {"\n\n"}
                1. Click the link in your email to set a password.{"\n"}
                2. After setting it, you will receive a second email with your App Password.
              </p>
            </div>

            <button
              onClick={onBack}
              className="sketch-btn sketch-btn-primary"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="sketch-field">
              <label className="field-label">Name</label>
              <input
                className="sketch-input"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="sketch-field">
              <label className="field-label">Phone Number</label>
              <input
                className="sketch-input"
                type="tel"
                placeholder="10-15 digits"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                pattern="[0-9]{10,15}"
                title="Phone number must be between 10 and 15 digits"
                required
              />
            </div>

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

            {error && (
              <p className="text-sm text-red-600 sketch-box p-2">{error}</p>
            )}

            <button
              type="submit"
              className="sketch-btn sketch-btn-primary mt-2"
              disabled={loading}
            >
              {loading ? "Registering…" : "Create Account"}
            </button>

            <div className="flex items-center justify-center gap-2 my-2">
              <span className="h-px w-full bg-slate-200"></span>
              <span className="text-sm text-slate-400 font-medium tracking-wide uppercase px-2">OR</span>
              <span className="h-px w-full bg-slate-200"></span>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Signup Failed")}
                text="signup_with"
              />
            </div>

            <button
              type="button"
              onClick={onBack}
              className="mt-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Already have an account? Log in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
