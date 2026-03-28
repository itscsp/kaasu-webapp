import { setAuth } from "./api";

const STORAGE_KEY = "kaasu_auth";

export function saveCredentials(username: string, appPassword: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ username, appPassword }));
  setAuth(username, appPassword);
}

export function loadCredentials(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  try {
    const { username, appPassword } = JSON.parse(stored);
    setAuth(username, appPassword);
    return true;
  } catch {
    return false;
  }
}

export function clearCredentials() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getStoredCredentials(): { username: string; appPassword: string } | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}
