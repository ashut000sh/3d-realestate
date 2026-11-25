// Which listings the logged-in user has saved (the heart button), shared by every page.
//
//   const { isSaved, toggle, count } = useSaved();
//   isSaved(listing.id)   -> true / false
//   toggle(listing.id)    -> saves or unsaves; returns { ok, needsLogin, error }
//
// The ids are loaded once per login and kept here, so every card and page agrees
// without each one asking the server. Changes show at once and are undone if the server says no.
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useAuth } from "./useAuth.jsx";
import { getSavedIds, saveListing, unsaveListing } from "../services/saved.service.js";

let state = { userId: null, ids: new Set() };
const listeners = new Set();

function setState(next) {
  state = next;
  listeners.forEach((listener) => listener());
}
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => state;

let loadingFor = null;
function loadFor(userId) {
  if (state.userId === userId || loadingFor === userId) return;
  loadingFor = userId;
  setState({ userId, ids: new Set() });
  getSavedIds()
    .then((ids) => state.userId === userId && setState({ userId, ids: new Set(ids) }))
    .catch(() => {}) // hearts just show empty if this fails
    .finally(() => {
      if (loadingFor === userId) loadingFor = null;
    });
}

export function useSaved() {
  const { user } = useAuth();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  const userId = user?.id ?? null;

  // Load the ids after login; forget them after logout
  useEffect(() => {
    if (userId) loadFor(userId);
    else if (state.userId !== null) setState({ userId: null, ids: new Set() });
  }, [userId]);

  const ids = snapshot.userId === userId ? snapshot.ids : new Set();

  const toggle = useCallback(
    async (listingId) => {
      if (!userId) return { ok: false, needsLogin: true };
      const wasSaved = state.ids.has(listingId);
      const next = new Set(state.ids);
      if (wasSaved) next.delete(listingId);
      else next.add(listingId);
      setState({ userId, ids: next });
      try {
        await (wasSaved ? unsaveListing(listingId) : saveListing(listingId));
        return { ok: true };
      } catch (err) {
        // Put it back the way it was
        const undo = new Set(state.ids);
        if (wasSaved) undo.add(listingId);
        else undo.delete(listingId);
        setState({ userId, ids: undo });
        return { ok: false, error: err.message };
      }
    },
    [userId],
  );

  return { isSaved: (id) => ids.has(id), toggle, count: ids.size, ids };
}
