// The properties the user picked to compare. Owner: M3.
// Kept in localStorage (key "compareIds") so the choice survives a page refresh.
// localStorage can be missing or blocked (private mode), so every read and write is in try/catch.
import { LIMITS } from "@realestate/shared";

const KEY = "compareIds";
const CHANGE_EVENT = "compare-change";

export function getCompareIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(ids) ? ids.filter(Number.isInteger).slice(0, LIMITS.MAX_COMPARE) : [];
  } catch {
    return [];
  }
}

function save(ids) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Storage blocked: the choice just won't survive a refresh
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Returns { ok: true } or { ok: false, error } (e.g. already 3 chosen)
export function addToCompare(id) {
  const ids = getCompareIds();
  if (ids.includes(id)) return { ok: true };
  if (ids.length >= LIMITS.MAX_COMPARE) {
    return {
      ok: false,
      error: `You can compare up to ${LIMITS.MAX_COMPARE} properties. Remove one on the Compare page first.`,
    };
  }
  save([...ids, id]);
  return { ok: true };
}

export function removeFromCompare(id) {
  save(getCompareIds().filter((other) => other !== id));
}

// Calls listener() whenever the list changes (in this tab or another tab). Returns an unsubscribe.
export function onCompareChange(listener) {
  const onStorage = (event) => event.key === KEY && listener();
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
