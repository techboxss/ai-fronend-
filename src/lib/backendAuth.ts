import { AppUser } from "../types";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

function mapBackendUser(user: any): AppUser | null {
  if (!user) return null;
  return {
    uid: user.sub || user.id || user.email || "google_user",
    displayName: user.name || user.displayName || user.email || "Google User",
    email: user.email || null,
    photoURL: user.picture || user.photoURL || null,
  };
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.authenticated ? mapBackendUser(data.user) : null;
}

export function startGoogleLogin() {
  window.location.href = `${API_BASE_URL}/api/auth/google/login`;
}

export async function backendLogout() {
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}
