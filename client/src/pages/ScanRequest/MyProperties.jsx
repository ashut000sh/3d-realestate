// "My properties" panel under the seller form: my scan requests and the booking
// requests on my listings (with Confirm / Decline). Owner: M3.
// refreshKey: change it to reload (e.g. after a new scan request).
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BOOKING_KIND, BOOKING_STATUS, SCAN_STATUS } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import Loader from "../../components/Loader.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { getMyBookings, updateBookingStatus } from "../../services/bookings.service.js";
import { getMyScanRequests } from "../../services/scans.service.js";

const SCAN_BADGE = {
  [SCAN_STATUS.PENDING]: { label: "Waiting for our team", className: "bg-accent/20 text-text" },
  [SCAN_STATUS.SCHEDULED]: { label: "Visit scheduled", className: "bg-primary/15 text-primary" },
  [SCAN_STATUS.SCANNED]: { label: "Scanned, tour coming", className: "bg-primary/15 text-primary" },
  [SCAN_STATUS.PUBLISHED]: { label: "3D tour live", className: "bg-success text-white" },
  [SCAN_STATUS.CANCELLED]: { label: "Cancelled", className: "bg-border text-muted" },
};

const BOOKING_BADGE = {
  [BOOKING_STATUS.REQUESTED]: { label: "New request", className: "bg-accent/20 text-text" },
  [BOOKING_STATUS.CONFIRMED]: { label: "Confirmed", className: "bg-success text-white" },
  [BOOKING_STATUS.DECLINED]: { label: "Declined", className: "bg-border text-muted" },
  [BOOKING_STATUS.CANCELLED]: { label: "Cancelled by buyer", className: "bg-border text-muted" },
};

function Badge({ badge, fallback }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${badge?.className ?? "bg-border"}`}
    >
      {badge?.label ?? fallback}
    </span>
  );
}

// "2026-12-21T04:15:00.000Z" -> "21 Dec 2026, 10:00" in the user's time zone
const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default function MyProperties({ refreshKey }) {
  const [scans, setScans] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    return Promise.all([getMyScanRequests(), getMyBookings("seller")])
      .then(([scanItems, bookingItems]) => {
        setScans(scanItems);
        setBookings(bookingItems);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

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

  if (loading) return <Loader label="Loading your properties..." />;

  return (
    <div className="space-y-8">
      {error && <p className="card text-danger">{error}</p>}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">My scan requests</h2>
        {scans.length === 0 ? (
          <p className="card text-muted">No scan requests yet. Add a property above.</p>
        ) : (
          <ul className="space-y-2">
            {scans.map((scan) => (
              <li
                key={scan.id}
                className="card flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    to={buildRoute(ROUTES.LISTING, { id: scan.listingId })}
                    className="font-medium hover:text-primary"
                  >
                    {scan.listingTitle}
                  </Link>
                  <p className="text-sm text-muted">
                    {scan.scheduledFor
                      ? `Visit: ${formatDateTime(scan.scheduledFor)}`
                      : `Preferred date: ${scan.preferredDate ?? "any"}`}
                  </p>
                </div>
                <Badge badge={SCAN_BADGE[scan.status]} fallback={scan.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Booking requests on my properties</h2>
        {bookings.length === 0 ? (
          <p className="card text-muted">No booking requests yet.</p>
        ) : (
          <ul className="space-y-2">
            {bookings.map((booking) => (
              <li key={booking.id} className="card space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link
                      to={buildRoute(ROUTES.LISTING, { id: booking.listingId })}
                      className="font-medium hover:text-primary"
                    >
                      {titleOf(booking.listingId)}
                    </Link>
                    <p className="text-sm text-muted">
                      {booking.kind === BOOKING_KIND.STAY
                        ? `Stay ${booking.date} to ${booking.checkOut}`
                        : `Viewing on ${booking.date}`}
                    </p>
                    {booking.message && <p className="mt-1 text-sm">"{booking.message}"</p>}
                  </div>
                  <Badge badge={BOOKING_BADGE[booking.status]} fallback={booking.status} />
                </div>

                {booking.status === BOOKING_STATUS.REQUESTED && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => changeBooking(booking.id, BOOKING_STATUS.CONFIRMED)}
                      disabled={busyId === booking.id}
                    >
                      Confirm
                    </Button>
                    <Button
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
  );
}
