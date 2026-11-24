// Live chat connection (Socket.IO). One connection for the whole Chat screen.
//
//   const { connected, send, joinAll, sendTyping } = useChatSocket({ onMessage, onTyping, onError });
//
// The server only sends messages for conversations we joined, so the screen joins all of
// the user's conversations (joinAll) to get live updates for every one of them.
import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_EVENTS } from "@realestate/shared";
import { tokenStore } from "../../services/api.js";

const SERVER_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function useChatSocket({ onMessage, onTyping, onError }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  // Keep the newest callbacks without reconnecting when they change
  const handlers = useRef({ onMessage, onTyping, onError });
  useEffect(() => {
    handlers.current = { onMessage, onTyping, onError };
  });

  useEffect(() => {
    const socket = io(SERVER_URL, {
      auth: { token: tokenStore.get() },
      transports: ["websocket"],
    });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (message) => handlers.current.onMessage?.(message));
    socket.on(SOCKET_EVENTS.TYPING, (payload) => handlers.current.onTyping?.(payload));
    socket.on(SOCKET_EVENTS.ERROR, (payload) => handlers.current.onError?.(payload.error));
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinAll = useCallback((conversationIds) => {
    conversationIds.forEach((conversationId) =>
      socketRef.current?.emit(SOCKET_EVENTS.JOIN_CONVERSATION, { conversationId }),
    );
  }, []);

  const send = useCallback((conversationId, body) => {
    socketRef.current?.emit(SOCKET_EVENTS.SEND_MESSAGE, { conversationId, body });
  }, []);

  const sendTyping = useCallback((conversationId) => {
    socketRef.current?.emit(SOCKET_EVENTS.TYPING, { conversationId });
  }, []);

  return { connected, joinAll, send, sendTyping };
}
