// A random id for anonymous visitors, kept in localStorage, so seller stats can count
// "one view per visitor per hour" without knowing who they are.
// Storage can be blocked (private mode, strict settings): then we use a key for this tab only.
const KEY = "aawasSessionKey";
let memoryKey = null;

function randomKey() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getSessionKey() {
  try {
    let key = localStorage.getItem(KEY);
    if (!key) {
      key = randomKey();
      localStorage.setItem(KEY, key);
    }
    return key;
  } catch {
    memoryKey ??= randomKey();
    return memoryKey;
  }
}
