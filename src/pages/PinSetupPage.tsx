import { useState } from "react";
import { encryptCredentials } from "@/lib/auth";
import { Logo } from "@/components/ui/logo";

interface Props {
  token: string;
  onComplete: () => void;
}

export default function PinSetupPage({ token, onComplete }: Props) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleDigit(digit: string) {
    if (step === "enter") {
      if (pin.length >= 4) return;
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) {
        // Auto-advance to confirm step
        setTimeout(() => setStep("confirm"), 180);
      }
    } else {
      if (confirmPin.length >= 4) return;
      const next = confirmPin + digit;
      setConfirmPin(next);
      if (next.length === 4) {
        // Auto-submit
        setTimeout(() => handleConfirm(next), 180);
      }
    }
    setError("");
  }

  function handleBackspace() {
    if (step === "enter") setPin((p) => p.slice(0, -1));
    else setConfirmPin((p) => p.slice(0, -1));
    setError("");
  }

  async function handleConfirm(confirmedPin: string) {
    if (pin !== confirmedPin) {
      setError("PINs don't match. Try again.");
      setConfirmPin("");
      setStep("enter");
      setPin("");
      return;
    }
    setLoading(true);
    await encryptCredentials(pin, token);
    setLoading(false);
    onComplete();
  }

  const currentPin = step === "enter" ? pin : confirmPin;

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <div className="phone-frame">
      <div className="flex flex-col h-full justify-center px-6 py-10 gap-8">
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="text-center">
          <h1 className="sketch-title text-xl mb-1">
            {step === "enter" ? "Set Your PIN" : "Confirm PIN"}
          </h1>
          <p className="text-sm text-gray-400">
            {step === "enter"
              ? "Choose a 4-digit PIN to unlock the app"
              : "Re-enter your PIN to confirm"}
          </p>
        </div>

        {/* PIN dots */}
        <div className="pin-dots">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`pin-dot ${i < currentPin.length ? "pin-dot-filled" : ""}`}
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
                id={`pin-setup-key-${key === "⌫" ? "backspace" : key}`}
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
          <p className="text-center text-sm text-gray-400 animate-pulse">Saving…</p>
        )}
      </div>
    </div>
  );
}
