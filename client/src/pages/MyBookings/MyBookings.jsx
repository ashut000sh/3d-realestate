// Screen:    MyBookings
// URL:       ROUTES.MY_BOOKINGS  ("/bookings")
// Job:       The viewings and stays I booked: upcoming and past, with status, and cancel.
//            Logged-in users only.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BOOKING_KIND, BOOKING_STATUS } from "@realestate/shared";
import Badge from "../../components/Badge.jsx";
import Button from "../../components/Button.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Icon from "../../components/Icon.jsx";
import { Skeleton } from "../../components/Loader.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { getMyBookings, updateBookingStatus } from "../../services/bookings.service.js";
import { LISTING_TYPE_LABEL } from "../../utils/formatPrice.js";
import { mediaUrl } from "../../utils/mediaUrl.js";

const STATUS_META = {
  [BOOKING_STATUS.REQUESTED]: { label: "Waiting for the seller", tone: "warning" },
  [BOOKING_STATUS.CONFIRMED]: { label: "Confirmed", tone: "success" },
  [BOOKING_STATUS.DECLINED]: { label: "Declined", tone: "danger" },
  [BOOKING_STATUS.CANCELLED]: { label: "Cancelled", tone: "neutral" },
};

const OPEN = [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.CONFIRMED];

// "YYYY-MM-DD" for today in the user's own time zone
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "2026-12-21" -> "Mon, 21 Dec 2026" (no time zone shift: built from the parts)
function formatDay(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function nights(from, to) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

// Upcoming = still open and not over yet. Everything else is history.
function isUpcoming(booking) {
  const lastDay = booking.checkOut ?? booking.date;
  return OPEN.includes(booking.status) && lastDay >= today();
}

function BookingRow({ booking, onCancel, busy }) {
  const meta = STATUS_META[booking.status] ?? { label: booking.status, tone: "neutral" };
  const isStay = booking.kind === BOOKING_KIND.STAY;
  const cover = mediaUrl(booking.listing?.coverImageUrl);
  const listingUrl = buildRoute(ROUTES.LISTING, { id: booking.listingId });

  return (
    <li className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <Link
        to={listingUrl}
        className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-sand sm:w-36"
      >
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-muted">
            <Icon name="image" className="h-6 w-6" />
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={meta.tone} dot>
            {meta.label}
          </Badge>
          <span className="text-xs font-medium tracking-wide text-muted uppercase">
            {isStay ? "Stay" : "Viewing"}
            {booking.listing?.type && ` · ${LISTING_TYPE_LABEL[booking.listing.type]}`}
          </span>
        </div>
        <Link to={listingUrl} className="block truncate font-semibold text-ink hover:text-primary">
          {booking.listing?.title ?? `Property #${booking.listingId}`}
        </Link>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Icon name="calendar" className="h-4 w-4" />
          {isStay
            ? `${formatDay(booking.date)} → ${formatDay(booking.checkOut)} · ${nights(booking.date, booking.checkOut)} nights`
            : formatDay(booking.date)}
          {booking.listing?.district && (
            <>
              <span aria-hidden="true">·</span> {booking.listing.district}
            </>
          )}
        </p>
        {booking.message && (
          <p className="line-clamp-1 text-sm text-muted italic">"{booking.message}"</p>
        )}
      </div>

      {OPEN.includes(booking.status) && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onCancel(booking)}
          loading={busy}
          className="self-start sm:self-center"
        >
          Cancel
        </Button>
      )}
    </li>
  );
}

export default function MyBookings() {
  const [tab, setTab] = useState("upcoming");
  const [result, setResult] = useState({ items: null, error: "" });
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    getMyBookings()
      .then((items) => !cancelled && setResult({ items, error: "" }))
      .catch((err) => !cancelled && setResult({ items: [], error: err.message }));
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCancel(booking) {
    const what = booking.kind === BOOKING_KIND.STAY ? "stay" : "viewing";
    if (!window.confirm(`Cancel this ${what}? The seller will see it as cancelled.`)) return;
    setBusyId(booking.id);
    setNotice("");
    try {
      const updated = await updateBookingStatus(booking.id, BOOKING_STATUS.CANCELLED);
      setResult((r) => ({
        ...r,
        items: r.items.map((b) => (b.id === booking.id ? { ...b, ...updated } : b)),
      }));
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const all = result.items ?? [];
  const upcoming = all
    .filter(isUpcoming)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id); // soonest first
  const past = all.filter((b) => !isUpcoming(b));
  const shown = tab === "upcoming" ? upcoming : past;

  const tabs = [
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "past", label: "Past & cancelled", count: past.length },
  ];

  return (
    <main className="page max-w-4xl space-y-8">
      <header>
        <p className="eyebrow">Your plans</p>
        <h1 className="page-title mt-2">My bookings</h1>
        <p className="mt-2 text-muted">
          Viewings and stays you've requested. The seller confirms each one.
        </p>
      </header>

      <div role="tablist" className="flex gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-semibold transition ${
              tab === t.key
                ? "border-primary text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
            {result.items && (
              <span className="rounded-full bg-sand px-2 text-xs text-muted">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {notice && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {notice}
        </p>
      )}

      {result.error ? (
        <EmptyState
          icon="alert"
          tone="danger"
          title="Couldn't load your bookings"
          text={result.error}
        />
      ) : result.items === null ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon="calendar"
          title={tab === "upcoming" ? "Nothing coming up" : "No past bookings"}
          text={
            tab === "upcoming"
              ? "Book a viewing or a short stay from any home's page."
              : "Bookings that are over, declined or cancelled show here."
          }
          action={
            tab === "upcoming" && (
              <Button to={ROUTES.SEARCH}>
                <Icon name="search" className="h-4 w-4" /> Find a home
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {shown.map((booking) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              onCancel={handleCancel}
              busy={busyId === booking.id}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
