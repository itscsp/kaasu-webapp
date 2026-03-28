import { useState } from "react";
import { decryptCredentials } from "@/lib/auth";
import { Logo } from "@/components/ui/logo";

interface Props {
  onSuccess: () => void;
  onForgotPin: () => void;
}

export default function PinEntryPage({ onSuccess, onForgotPin }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(enteredPin: string) {
    setLoading(true);
    const ok = await decryptCredentials(enteredPin);
    setLoading(false);
    if (ok) {
      onSuccess();
    } else {
      setError("Incorrect PIN. Try again.");
      setShake(true);
      setPin("");
      setTimeout(() => setShake(false), 600);
    }
  }

  function handleDigit(digit: string) {
    if (pin.length >= 4 || loading) return;
    const next = pin + digit;
    setPin(next);
    setError("");
    if (next.length === 4) {
      setTimeout(() => handleSubmit(next), 120);
    }
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1));
    setError("");
  }

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <div className="phone-frame">
      <div className="flex flex-col h-full justify-center px-6 py-10 gap-8">
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="text-center">
          <h1 className="sketch-title text-xl mb-1">Enter PIN</h1>
          <p className="text-sm text-gray-400">Use your PIN to unlock the app</p>
        </div>

        {/* PIN dots */}
        <div className={`pin-dots ${shake ? "pin-shake" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`pin-dot ${i < pin.length ? "pin-dot-filled" : ""}`}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center -mt-4">{error}</p>
        )}

        {/* Keypad */}
        <div className="pin-keypad">
          {keys.map((key, idx) => {
            if (key === "") return <div key={idx} />;
            return (
              <button
                key={idx}
                id={`pin-entry-key-${key === "⌫" ? "backspace" : key}`}
                className={`pin-key ${key === "⌫" ? "pin-key-back" : ""}`}
                onClick={() => (key === "⌫" ? handleBackspace() : handleDigit(key))}
                disabled={loading}
                aria-label={key === "⌫" ? "Backspace" : key}
              >
                {key}
              </button>
            );
          })}
        </div>

        {loading && (
          <p className="text-center text-sm text-gray-400 animate-pulse">Verifying…</p>
        )}

        {/* Forgot PIN */}
        <div className="text-center mt-2">
          <button
            id="pin-forgot-btn"
            onClick={onForgotPin}
            className="text-sm text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors"
          >
            Forgot PIN? Login with credentials
          </button>
        </div>
      </div>
    </div>
  );
}
