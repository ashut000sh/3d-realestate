// Live chat over Socket.IO. Owner: M5. Event names: shared/socket-events.js.
//
// The client connects with its login token:
//   io(SERVER_URL, { auth: { token } })
// then joins a conversation and sends messages:
//   socket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, { conversationId })
//   socket.emit(SOCKET_EVENTS.SEND_MESSAGE, { conversationId, body })
// Everyone in the conversation (the sender too) receives SOCKET_EVENTS.NEW_MESSAGE with the saved Message.
// Problems come back as SOCKET_EVENTS.ERROR { error }.
import { SOCKET_EVENTS } from "@realestate/shared";
import { verifyToken } from "../../middleware/auth.js";
import * as chatService from "./chat.service.js";

const room = (conversationId) => `conversation:${conversationId}`;

function readConversationId(payload) {
  const id = Number(payload?.conversationId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Sends the error to this socket only. Server errors (500s) are logged, not shown.
function sendError(socket, err) {
  if (!err.status || err.status >= 500) console.error("chat socket:", err);
  socket.emit(SOCKET_EVENTS.ERROR, {
    error: err.status && err.status < 500 ? err.message : "Something went wrong",
  });
}

export function registerChatSocket(io) {
  // Every connection must carry a valid token, or it is refused.
  io.use((socket, next) => {
    const user = verifyToken(socket.handshake.auth?.token ?? "");
    if (!user) return next(new Error("Not logged in"));
    socket.data.user = user; // { id, role }
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.data.user.id;

    socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, async (payload) => {
      try {
        const conversationId = readConversationId(payload);
        if (!conversationId)
          return sendError(socket, { status: 400, message: "conversationId is required" });
        await chatService.assertParticipant(conversationId, userId);
        socket.join(room(conversationId));
        await chatService.markRead(conversationId, userId);
      } catch (err) {
        sendError(socket, err);
      }
    });

    socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (payload) => {
      try {
        const conversationId = readConversationId(payload);
        const body = typeof payload?.body === "string" ? payload.body.trim() : "";
        if (!conversationId)
          return sendError(socket, { status: 400, message: "conversationId is required" });
        if (!body) return sendError(socket, { status: 400, message: "Message can't be empty" });
        if (body.length > chatService.MAX_MESSAGE_LENGTH) {
          return sendError(socket, {
            status: 400,
            message: `Message can be at most ${chatService.MAX_MESSAGE_LENGTH} characters`,
          });
        }

        // saveMessage checks the sender is in the conversation (403 otherwise)
        const message = await chatService.saveMessage(conversationId, userId, body);
        socket.join(room(conversationId)); // in case they sent without joining first
        io.to(room(conversationId)).emit(SOCKET_EVENTS.NEW_MESSAGE, message);
      } catch (err) {
        sendError(socket, err);
      }
    });

    // "is typing..." goes to the other person only. userId comes from the token, not the client.
    socket.on(SOCKET_EVENTS.TYPING, (payload) => {
      const conversationId = readConversationId(payload);
      if (conversationId && socket.rooms.has(room(conversationId))) {
        socket.to(room(conversationId)).emit(SOCKET_EVENTS.TYPING, { conversationId, userId });
      }
    });
  });
}
