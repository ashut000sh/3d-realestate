// "My properties" panel under the seller form: my scan requests and the booking
// requests on my listings (with Confirm / Decline). Owner: M3.
// refreshKey: change it to reload (e.g. after a new scan request).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BOOKING_KIND, BOOKING_STATUS, SCAN_STATUS } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import Badge from "../../components/Badge.jsx";
import Icon from "../../components/Icon.jsx";
import { Skeleton } from "../../components/Loader.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { getMyBookings, updateBookingStatus } from "../../services/bookings.service.js";
import { getMyScanRequests } from "../../services/scans.service.js";

const SCAN_BADGE = {
  [SCAN_STATUS.PENDING]: { label: "Waiting for our team", tone: "warning" },
  [SCAN_STATUS.SCHEDULED]: { label: "Visit scheduled", tone: "info" },
  [SCAN_STATUS.SCANNED]: { label: "Scanned, tour coming", tone: "primary" },
  [SCAN_STATUS.PUBLISHED]: { label: "3D tour live", tone: "success" },
  [SCAN_STATUS.CANCELLED]: { label: "Cancelled", tone: "neutral" },
};

const BOOKING_BADGE = {
  [BOOKING_STATUS.REQUESTED]: { label: "New request", tone: "gold" },
  [BOOKING_STATUS.CONFIRMED]: { label: "Confirmed", tone: "success" },
  [BOOKING_STATUS.DECLINED]: { label: "Declined", tone: "neutral" },
  [BOOKING_STATUS.CANCELLED]: { label: "Cancelled by buyer", tone: "neutral" },
};

function StatusBadge({ badge, fallback }) {
  return (
    <Badge tone={badge?.tone ?? "neutral"} dot>
      {badge?.label ?? fallback}
    </Badge>
  );
}

// "2026-12-21T04:15:00.000Z" -> "21 Dec 2026, 10:00" in the user's time zone
const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default function MyProperties({ refreshKey }) {
  const [scans, setScans] = useState([]);
  const [bookings, setBookings] = useState([]);
  // loadedKey = which refreshKey the lists belong to. While it differs we are loading
  // (worked out here, not set inside the effect).
  const [loadedKey, setLoadedKey] = useState(null);
  const loading = loadedKey !== refreshKey;
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMyScanRequests(), getMyBookings("seller")])
      .then(([scanItems, bookingItems]) => {
        if (cancelled) return;
        setScans(scanItems);
        setBookings(bookingItems);
        setError("");
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoadedKey(refreshKey));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function changeBooking(id, status) {
    setBusyId(id);
    try {
      const updated = await updateBookingStatus(id, status);
      setBookings((list) => list.map((b) => (b.id === id ? updated : b)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  // Booking has no listing title, so take it from my scan requests when we know it
  const titleOf = (listingId) =>
    scans.find((s) => s.listingId === listingId)?.listingTitle ?? `Property #${listingId}`;

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const newRequests = bookings.filter((b) => b.status === BOOKING_STATUS.REQUESTED).length;

  return (
    <div className="space-y-6">
      {error && (
        <p className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          <Icon name="alert" className="h-4 w-4" /> {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-0">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="flex items-center gap-2 font-semibold text-ink">
              <Icon name="scan" className="h-5 w-5 text-accent-dark" /> My scan requests
            </h3>
            <span className="text-sm text-muted">{scans.length}</span>
          </header>
          {scans.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">
              No scan requests yet. Add a property above.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {scans.map((scan) => (
                <li key={scan.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <Link
                      to={buildRoute(ROUTES.LISTING, { id: scan.listingId })}
                      className="block truncate font-medium text-ink hover:text-primary"
                    >
                      {scan.listingTitle}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                      <Icon name="calendar" className="h-3.5 w-3.5" />
                      {scan.scheduledFor
                        ? `Visit: ${formatDateTime(scan.scheduledFor)}`
                        : `Preferred: ${scan.preferredDate ?? "any day"}`}
                    </p>
                  </div>
                  <StatusBadge badge={SCAN_BADGE[scan.status]} fallback={scan.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-0">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="flex items-center gap-2 font-semibold text-ink">
              <Icon name="calendar" className="h-5 w-5 text-accent-dark" /> Booking requests
            </h3>
            {newRequests > 0 && <Badge tone="gold">{newRequests} new</Badge>}
          </header>
          {bookings.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">No booking requests yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {bookings.map((booking) => (
                <li key={booking.id} className="space-y-3 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={buildRoute(ROUTES.LISTING, { id: booking.listingId })}
                        className="block truncate font-medium text-ink hover:text-primary"
                      >
                        {titleOf(booking.listingId)}
                      </Link>
                      <p className="mt-0.5 text-sm text-muted">
                        {booking.kind === BOOKING_KIND.STAY
                          ? `Stay · ${booking.date} → ${booking.checkOut}`
                          : `Viewing · ${booking.date}`}
                      </p>
                    </div>
                    <StatusBadge badge={BOOKING_BADGE[booking.status]} fallback={booking.status} />
                  </div>
                  {booking.message && (
                    <p className="rounded-xl bg-sand/60 px-3 py-2 text-sm text-text">
                      “{booking.message}”
                    </p>
                  )}
                  {booking.status === BOOKING_STATUS.REQUESTED && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => changeBooking(booking.id, BOOKING_STATUS.CONFIRMED)}
                        loading={busyId === booking.id}
                      >
                        <Icon name="check" className="h-4 w-4" /> Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => changeBooking(booking.id, BOOKING_STATUS.DECLINED)}
                        disabled={busyId === booking.id}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
