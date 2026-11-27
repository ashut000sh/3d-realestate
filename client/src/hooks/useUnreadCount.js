// Number of unread chat messages for the logged-in user, for the badge on "Messages".
// Asks the server when the page changes, when the tab gets focus, and every 30 seconds.
//   const unread = useUnreadCount();
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./useAuth.jsx";
import { getConversations } from "../services/chat.service.js";

const EVERY_MS = 30_000;

export function useUnreadCount() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [state, setState] = useState({ userId: null, count: 0 });
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    const check = () =>
      getConversations()
        .then((items) => {
          const count = items.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
          if (!cancelled) setState({ userId, count });
        })
        .catch(() => {}); // the badge just stays as it was
    check();
    const timer = setInterval(check, EVERY_MS);
    window.addEventListener("focus", check);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, [userId, pathname]);

  // After logout (or before the first answer) there's nothing unread
  return userId && state.userId === userId ? state.count : 0;
}
