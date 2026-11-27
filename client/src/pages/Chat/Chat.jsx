// Screen:    Chat
// URL:       ROUTES.CHAT  ("/chat", open one with ?c=<conversationId>)
// Owner:     M2  (see docs/TEAM.md)
// Wireframe: 10 Chat
// Job:       Conversation list + message thread. REST for history, Socket.IO for live messages.
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Avatar from "../../components/Avatar.jsx";
import Button from "../../components/Button.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Icon from "../../components/Icon.jsx";
import { Skeleton } from "../../components/Loader.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { useAuth } from "../../hooks/useAuth.jsx";
import { getConversations, getMessages } from "../../services/chat.service.js";
import { useChatSocket } from "./useChatSocket.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";

const PAGE_SIZE = 30; // the server sends 30 messages per page
const MAX_LENGTH = 2000;

const timeOf = (iso) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function shortWhen(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return timeOf(iso);
  const days = (today - date) / 86400000;
  if (days < 7) return date.toLocaleDateString("en-GB", { weekday: "short" });
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function dayLabel(iso) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

// ---------- conversation list ----------

function ConversationList({ conversations, selectedId, onSelect, filter, setFilter }) {
  const shown = conversations.filter((c) => {
    const q = filter.trim().toLowerCase();
    return (
      !q ||
      c.otherUser.fullName.toLowerCase().includes(q) ||
      c.listing.title.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <h1 className="display text-2xl text-ink">Messages</h1>
        <div className="relative mt-3">
          <Icon
            name="search"
            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
          />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search people or homes"
            className="field h-10 pl-9 text-sm"
          />
        </div>
      </div>
      <ul className="flex-1 overflow-y-auto p-2">
        {shown.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-muted">No conversations match.</li>
        )}
        {shown.map((c) => {
          const active = c.id === selectedId;
          return (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c.id)}
                className={`flex w-full gap-3 rounded-xl p-3 text-left transition ${
                  active ? "bg-primary-soft" : "hover:bg-sand/70"
                }`}
              >
                <Avatar name={c.otherUser.fullName} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span
                      className={`truncate ${c.unreadCount > 0 ? "font-bold text-ink" : "font-semibold"}`}
                    >
                      {c.otherUser.fullName}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {shortWhen(c.lastMessage?.createdAt)}
                    </span>
                  </span>
                  <span className="block truncate text-xs font-medium text-accent-dark">
                    {c.listing.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span
                      className={`truncate text-sm ${c.unreadCount > 0 ? "text-ink" : "text-muted"}`}
                    >
                      {c.lastMessage?.body ?? "No messages yet"}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------- message thread ----------

function Thread({
  conversation,
  thread,
  me,
  typing,
  connected,
  onSend,
  onTyping,
  onLoadOlder,
  onBack,
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);
  const lastId = thread?.items.at(-1)?.id;

  // Jump to the newest message when it changes (not when older ones load at the top)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lastId, conversation.id]);

  function submit(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    onSend(body);
    setDraft("");
  }

  // Group messages under day headings
  const groups = [];
  (thread?.items ?? []).forEach((message) => {
    const label = dayLabel(message.createdAt);
    if (groups.at(-1)?.label !== label) groups.push({ label, items: [] });
    groups.at(-1).items.push(message);
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          onClick={onBack}
          className="-ml-1 rounded-lg p-1.5 hover:bg-sand md:hidden"
          aria-label="Back to conversations"
        >
          <Icon name="arrowLeft" className="h-5 w-5" />
        </button>
        <Avatar name={conversation.otherUser.fullName} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{conversation.otherUser.fullName}</p>
          <p className="truncate text-xs text-muted">
            {typing ? <span className="text-primary">typing…</span> : conversation.listing.title}
          </p>
        </div>
        <Button
          to={buildRoute(ROUTES.LISTING, { id: conversation.listing.id })}
          variant="secondary"
          size="sm"
          className="hidden sm:inline-flex"
        >
          View home <Icon name="arrowRight" className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_1px_1px,rgb(14_42_35/0.05)_1px,transparent_0)] bg-[length:18px_18px] px-4 py-5 sm:px-6">
        {!thread ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="ml-auto h-12 w-1/2" />
            <Skeleton className="h-16 w-3/5" />
          </div>
        ) : (
          <>
            {thread.hasMore && (
              <div className="mb-4 text-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onLoadOlder}
                  loading={thread.loadingOlder}
                >
                  Load earlier messages
                </Button>
              </div>
            )}
            {thread.items.length === 0 && (
              <div className="mx-auto mt-10 max-w-xs text-center text-sm text-muted">
                <Icon name="chat" className="mx-auto mb-3 h-8 w-8 text-accent" />
                Say hello to {conversation.otherUser.fullName.split(" ")[0]} and ask anything about{" "}
                {conversation.listing.title}.
              </div>
            )}
            {groups.map((group) => (
              <section key={group.label} className="space-y-1.5">
                <p className="my-4 text-center">
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted shadow-[var(--shadow-soft)]">
                    {group.label}
                  </span>
                </p>
                {group.items.map((message, i) => {
                  const mine = message.senderId === me.id;
                  const nextSame = group.items[i + 1]?.senderId === message.senderId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] animate-fade-in px-4 py-2.5 text-[15px] leading-relaxed shadow-[var(--shadow-soft)] sm:max-w-[65%] ${
                          mine
                            ? `bg-primary text-white ${nextSame ? "rounded-2xl" : "rounded-2xl rounded-br-md"}`
                            : `bg-surface text-text ${nextSame ? "rounded-2xl" : "rounded-2xl rounded-bl-md"}`
                        }`}
                      >
                        <p className="break-words whitespace-pre-wrap">{message.body}</p>
                        <p
                          className={`mt-1 text-right text-[11px] ${mine ? "text-white/60" : "text-muted"}`}
                        >
                          {timeOf(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </section>
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={submit}
        className="flex items-end gap-2 border-t border-border bg-surface p-3"
      >
        <textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value.slice(0, MAX_LENGTH));
            onTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) submit(e);
          }}
          rows={1}
          placeholder={connected ? "Write a message…" : "Connecting…"}
          aria-label="Message"
          className="field max-h-36 min-h-11 flex-1 resize-none py-2.5"
        />
        <Button
          type="submit"
          className="h-11 w-11 px-0"
          disabled={!draft.trim() || !connected}
          aria-label="Send"
        >
          <Icon name="send" className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}

// ---------- screen ----------

export default function Chat() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = Number(searchParams.get("c")) || null;

  const [conversations, setConversations] = useState(null); // null = loading
  const [listError, setListError] = useState("");
  const [threads, setThreads] = useState({}); // { [conversationId]: { items, hasMore, loadingOlder } }
  const [typingIn, setTypingIn] = useState({}); // { [conversationId]: true }
  const [filter, setFilter] = useState("");
  const [socketError, setSocketError] = useState("");
  const selectedRef = useRef(selectedId);
  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  const typingTimers = useRef({});
  const lastTypingSent = useRef(0);

  const { connected, joinAll, send, sendTyping } = useChatSocket({
    onMessage(message) {
      setThreads((all) => {
        const thread = all[message.conversationId];
        if (!thread || thread.items.some((m) => m.id === message.id)) return all;
        return {
          ...all,
          [message.conversationId]: { ...thread, items: [...thread.items, message] },
        };
      });
      setConversations((list) => {
        if (!list) return list;
        const found = list.find((c) => c.id === message.conversationId);
        if (!found) return list;
        const fromOther = message.senderId !== user.id;
        const isOpen = selectedRef.current === message.conversationId;
        const updated = {
          ...found,
          lastMessage: { body: message.body, createdAt: message.createdAt },
          unreadCount: fromOther && !isOpen ? found.unreadCount + 1 : found.unreadCount,
        };
        // Newest conversation first
        return [updated, ...list.filter((c) => c.id !== found.id)];
      });
      setTypingIn((all) => ({ ...all, [message.conversationId]: false }));
    },
    onTyping({ conversationId, userId }) {
      if (userId === user.id) return;
      setTypingIn((all) => ({ ...all, [conversationId]: true }));
      clearTimeout(typingTimers.current[conversationId]);
      typingTimers.current[conversationId] = setTimeout(
        () => setTypingIn((all) => ({ ...all, [conversationId]: false })),
        3000,
      );
    },
    onError: setSocketError,
  });

  // Conversation list
  useEffect(() => {
    let cancelled = false;
    getConversations()
      .then((items) => !cancelled && setConversations(items))
      .catch((err) => !cancelled && setListError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // Join every conversation once both the list and the socket are ready
  const idsKey = conversations?.map((c) => c.id).join(",") ?? "";
  useEffect(() => {
    if (connected && idsKey) joinAll(idsKey.split(",").map(Number));
  }, [connected, idsKey, joinAll]);

  // History for the open conversation (newest page). Opening it also marks it read.
  const hasThread = selectedId ? Boolean(threads[selectedId]) : true;
  useEffect(() => {
    if (!selectedId || hasThread) return undefined;
    let cancelled = false;
    getMessages(selectedId)
      .then((items) => {
        if (cancelled) return;
        setThreads((all) => ({
          ...all,
          [selectedId]: { items, hasMore: items.length === PAGE_SIZE },
        }));
        setConversations((list) =>
          list?.map((c) => (c.id === selectedId ? { ...c, unreadCount: 0 } : c)),
        );
      })
      .catch((err) => !cancelled && setSocketError(err.message));
    return () => {
      cancelled = true;
    };
  }, [selectedId, hasThread]);

  async function loadOlder() {
    const thread = threads[selectedId];
    if (!thread?.items.length) return;
    setThreads((all) => ({ ...all, [selectedId]: { ...thread, loadingOlder: true } }));
    try {
      const older = await getMessages(selectedId, thread.items[0].id);
      setThreads((all) => ({
        ...all,
        [selectedId]: {
          items: [...older, ...all[selectedId].items],
          hasMore: older.length === PAGE_SIZE,
          loadingOlder: false,
        },
      }));
    } catch (err) {
      setSocketError(err.message);
      setThreads((all) => ({ ...all, [selectedId]: { ...all[selectedId], loadingOlder: false } }));
    }
  }

  function select(id) {
    setSearchParams(id ? { c: String(id) } : {});
    setConversations((list) =>
      list?.map((c) => (c.id === id && threads[id] ? { ...c, unreadCount: 0 } : c)),
    );
  }

  function handleTyping() {
    // At most one "typing" event every 2 seconds
    if (Date.now() - lastTypingSent.current > 2000) {
      lastTypingSent.current = Date.now();
      sendTyping(selectedId);
    }
  }

  const selected = conversations?.find((c) => c.id === selectedId);

  usePageTitle("Messages");

  if (listError) {
    return (
      <main className="page">
        <EmptyState
          icon="alert"
          tone="danger"
          title="Couldn't load your messages"
          text={listError}
        />
      </main>
    );
  }

  if (conversations && conversations.length === 0) {
    return (
      <main className="page">
        <EmptyState
          icon="chat"
          title="No conversations yet"
          text="Open a home you like and press “Chat with seller” to ask a question. Your chats will appear here."
          action={<Button to={ROUTES.SEARCH}>Explore homes</Button>}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-0 py-0 sm:px-6 sm:py-8 lg:px-8">
      {socketError && (
        <p className="mx-4 mb-3 flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger sm:mx-0">
          <Icon name="alert" className="h-4 w-4" /> {socketError}
          <button className="ml-auto" onClick={() => setSocketError("")} aria-label="Dismiss">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </p>
      )}
      <div className="grid h-[calc(100dvh-4rem)] overflow-hidden border-border bg-surface sm:h-[calc(100dvh-9rem)] sm:rounded-[var(--radius-card)] sm:border sm:shadow-[var(--shadow-soft)] md:grid-cols-[340px_1fr]">
        <aside
          className={`min-h-0 border-r border-border ${selectedId ? "hidden md:block" : "block"}`}
        >
          {conversations ? (
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              onSelect={select}
              filter={filter}
              setFilter={setFilter}
            />
          ) : (
            <div className="space-y-3 p-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          )}
        </aside>

        <section className={`min-h-0 ${selectedId ? "block" : "hidden md:block"}`}>
          {selected ? (
            <Thread
              key={selected.id}
              conversation={selected}
              thread={threads[selected.id]}
              me={user}
              typing={typingIn[selected.id]}
              connected={connected}
              onSend={(body) => send(selected.id, body)}
              onTyping={handleTyping}
              onLoadOlder={loadOlder}
              onBack={() => select(null)}
            />
          ) : (
            <div className="hidden h-full flex-col items-center justify-center p-10 text-center md:flex">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent-dark">
                <Icon name="chat" className="h-7 w-7" />
              </span>
              <p className="display mt-4 text-xl text-ink">Pick a conversation</p>
              <p className="mt-1 max-w-xs text-sm text-muted">
                Chat with sellers about viewings, prices and anything else.{" "}
                <Link to={ROUTES.SEARCH} className="link">
                  Find a home
                </Link>
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
