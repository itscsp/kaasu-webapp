import { setAuth } from "./api";

const STORAGE_KEY = "kaasu_auth";
const PIN_KEY = "kaasu_pin_encrypted";

// ── Plain-credential helpers (kept for fallback / first-time setup) ──

export function saveCredentials(token: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token }));
  setAuth(token);
}

export function loadCredentials(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  try {
    const { token } = JSON.parse(stored);
    setAuth(token);
    return true;
  } catch {
    return false;
  }
}

export function clearCredentials() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getStoredCredentials(): { token: string } | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// ── PIN helpers ──

/** Returns true if an encrypted PIN blob exists in localStorage */
export function hasPinSetup(): boolean {
  return !!localStorage.getItem(PIN_KEY);
}

/** Removes the PIN-encrypted blob (e.g. on logout / credential re-entry) */
export function clearPin() {
  localStorage.removeItem(PIN_KEY);
}

// ── Web Crypto helpers ──

function buf2hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hex2buf(hex: string): Uint8Array<ArrayBuffer> {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return arr as Uint8Array<ArrayBuffer>;
}

async function deriveKey(pin: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawPin = enc.encode(pin) as Uint8Array<ArrayBuffer>;
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    rawPin,
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts token with the given PIN and stores the result
 * in localStorage. The PIN itself is never stored.
 */
export async function encryptCredentials(
  pin: string,
  token: string
): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16)) as Uint8Array<ArrayBuffer>;
  const iv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>;
  const key = await deriveKey(pin, salt);
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify({ token })) as Uint8Array<ArrayBuffer>;
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  localStorage.setItem(
    PIN_KEY,
    JSON.stringify({
      salt: buf2hex(salt.buffer),
      iv: buf2hex(iv.buffer),
      ciphertext: buf2hex(ciphertext),
    })
  );
}

/**
 * Decrypts stored credentials using the given PIN.
 * On success: calls setAuth() and returns true.
 * On failure (wrong PIN or no data): returns false.
 */
export async function decryptCredentials(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_KEY);
  if (!stored) return false;
  try {
    const { salt, iv, ciphertext } = JSON.parse(stored);
    const key = await deriveKey(pin, hex2buf(salt));
    const dec = new TextDecoder();
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: hex2buf(iv) },
      key,
      hex2buf(ciphertext).buffer
    );
    const { token } = JSON.parse(dec.decode(plaintext));
    setAuth(token);
    return true;
  } catch {
    // Wrong PIN → AES-GCM authentication tag mismatch throws
    return false;
  }
}
