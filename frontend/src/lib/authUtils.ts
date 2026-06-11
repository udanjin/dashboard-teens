import type { UserInfo } from "@/types";

const USER_STORAGE_KEY = "user";

export function saveUser(user: UserInfo): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function getStoredUser(): UserInfo | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UserInfo;
  } catch {
    sessionStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(USER_STORAGE_KEY);
}
