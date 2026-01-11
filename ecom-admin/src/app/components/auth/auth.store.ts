type AuthState = {
  token?: string;
  user?: { email: string };
};

const KEY = "ecom-admin-auth";

let state: AuthState | null = null;

export function getAuth() {
  if (state) return state;
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  state = raw ? JSON.parse(raw) : null;
  return state;
}

export function setAuth(next: AuthState) {
  state = next;
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearUser() {
  state = null;
  localStorage.removeItem(KEY);
}

export function isAuthed() {
  return Boolean(getAuth()?.token);
}
