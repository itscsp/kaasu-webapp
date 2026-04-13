import { setAuth } from "./api";

const STORAGE_KEY = "kaasu_auth";

// ── Plain-credential helpers ──

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
