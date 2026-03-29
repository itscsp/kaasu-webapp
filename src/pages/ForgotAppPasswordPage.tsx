import { useState } from "react";
import { api } from "@/lib/api";
import { Logo } from "@/components/ui/logo";

interface Props {
  onBack: () => void;
}

export default function ForgotAppPasswordPage({ onBack }: Props) {
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.auth.forgotAppPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to request credentials. Please check your email.");
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
              <h2 className="text-xl font-bold mb-4">Email Sent!</h2>
              <p className="text-gray-500 mb-4 whitespace-pre-wrap text-sm">
                If an account exists with that email, we've sent you an email with your new Application Password.
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
            <h2 className="text-xl font-bold mb-2 text-center text-white">Forgot App Password?</h2>
            <p className="text-sm text-gray-400 mb-4 text-center">
              Enter your email address to receive your application credentials again.
            </p>

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
              {loading ? "Requesting…" : "Resend Credentials"}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="mt-2 text-sm text-gray-400 hover:text-black transition-colors"
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
