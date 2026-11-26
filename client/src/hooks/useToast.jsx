// Small pop-up messages in the bottom corner ("Saved", "Link copied"...).
//   const toast = useToast();
//   toast("Link copied");                       success (default)
//   toast("Couldn't save", { tone: "error" });  error
// <ToastProvider> wraps the app in main.jsx.
import { createContext, useCallback, useContext, useRef, useState } from "react";
import Icon from "../components/Icon.jsx";

const ToastContext = createContext(() => {});
const DURATION_MS = 3200;

const TONES = {
  success: { icon: "check", dot: "bg-success text-white" },
  error: { icon: "alert", dot: "bg-danger text-white" },
  info: { icon: "info", dot: "bg-accent text-ink" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (message, { tone = "success" } = {}) => {
      const id = nextId.current++;
      setToasts((all) => [...all.slice(-2), { id, message, tone }]); // at most 3 on screen
      setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[1000] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((t) => {
          const tone = TONES[t.tone] ?? TONES.success;
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex max-w-sm animate-fade-up items-center gap-3 rounded-2xl bg-ink py-3 pr-3 pl-3 text-sm font-medium text-white shadow-[var(--shadow-lift)]"
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${tone.dot}`}>
                <Icon name={tone.icon} className="h-4 w-4" strokeWidth={2.4} />
              </span>
              <span className="flex-1">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
