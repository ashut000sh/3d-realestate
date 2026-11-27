// Small white card over the map while a walking route is shown.
// <RouteCard state={{ status: "loading" | "ready" | "error", target, data, error }} onClear={...} />
import Icon from "../../components/Icon.jsx";
import { formatDistance } from "./nearbyCategories.js";

// A person walking, drawn for this card (stroke icon, 24x24)
function WalkerIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="13" cy="4" r="1.8" />
      <path d="m10 21 2.2-6.5L15 17v4" />
      <path d="M8 11.5 10.5 8l3.5.5 2 3.5 2.5 1" />
      <path d="M12.2 14.5 13 9" />
    </svg>
  );
}

export default function RouteCard({ state, onClear }) {
  const { status, target, data, error } = state;
  return (
    <div
      className="rounded-[20px] bg-surface p-3 shadow-[0_12px_32px_-12px_rgb(14_42_35/0.35)] ring-1 ring-black/5 sm:p-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
          <WalkerIcon /> On foot
        </span>
        <button
          type="button"
          onClick={onClear}
          className="-mt-1 -mr-1 rounded-full px-2 py-1 text-xs font-semibold text-muted transition hover:bg-sand hover:text-ink"
        >
          Clear
        </button>
      </div>

      {status === "loading" && (
        <div className="mt-3 space-y-2" aria-label="Finding the walking route">
          <div className="skeleton h-9 w-24" />
          <div className="skeleton h-4 w-full" />
        </div>
      )}

      {status === "error" && (
        <p className="mt-3 flex items-start gap-2 text-sm text-danger">
          <Icon name="alert" className="mt-0.5 h-4 w-4" /> {error}
        </p>
      )}

      {status === "ready" && data && (
        <>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              {data.durationMinutes} min
            </span>
            <span className="text-sm font-medium text-muted">
              {data.approximate && "approx. "}· {formatDistance(data.distanceMeters)}
            </span>
          </p>
          <p className="mt-1 line-clamp-1 text-sm text-muted sm:line-clamp-2">
            From this home to <span className="font-medium text-text">{target.name}</span>
          </p>
          {data.approximate && (
            <p className="mt-2 text-xs text-warning">
              Street route unavailable right now: straight-line estimate.
            </p>
          )}
        </>
      )}
    </div>
  );
}
