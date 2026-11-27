// The ONE function that talks to the backend. Pages never call fetch() directly:
// they call a function from services/<module>.service.js, which calls request().
// API broken for everyone? Look here first.
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function request(method, path, { body, query } = {}) {
  const url = new URL(path, BASE_URL);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== "") url.searchParams.set(key, value);
    });
  }

  // File uploads: pass a FormData as body and the browser sets the right headers itself.
  const isForm = body instanceof FormData;
  const token = tokenStore.get();
  const res = await fetch(url, {
    method,
    headers: {
      ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error ?? `Request failed (${res.status})`);
    error.status = res.status;
    error.data = data; // extra fields, e.g. login's 403 { error, userId }
    throw error;
  }
  return data;
}
