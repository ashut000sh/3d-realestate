// Screen:    Booking
// URL:       ROUTES.BOOKING  ("/listings/:id/book")
// Owner:     M3  (see docs/TEAM.md)
// Wireframe: 9 Book / Request Viewing
// Job:       Pick a date for a viewing or a short stay. Calls BOOKINGS.CREATE.
//
// Sale or rent listing -> a viewing on one date.
// Short stay listing   -> a stay from check-in to check-out.
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BOOKING_KIND, LISTING_TYPE } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import Loader from "../../components/Loader.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { tokenStore } from "../../services/api.js";
import { createBooking } from "../../services/bookings.service.js";
import { getListing } from "../../services/listings.service.js";
import { formatPrice } from "../../utils/formatPrice.js";

const MAX_MESSAGE_LENGTH = 1000;

// "YYYY-MM-DD" for a date in the user's own time zone (Nepal), `days` from today
function localDate(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Number of nights between two "YYYY-MM-DD" dates
function nightsBetween(from, to) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

export default function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState({ date: "", checkOut: "", message: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null); // set after a successful request

  useEffect(() => {
    let cancelled = false;
    getListing(id)
      .then((data) => !cancelled && setListing(data))
      .catch((err) => !cancelled && setLoadError({ status: err.status, message: err.message }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loadError) {
    return (
      <main className="page space-y-3">
        <h1 className="page-title">
          {loadError.status === 404 ? "Property not found" : "Couldn't load this property"}
        </h1>
        <Link to={ROUTES.SEARCH} className="font-medium text-primary hover:underline">
          Back to search
        </Link>
      </main>
    );
  }
  if (!listing) {
    return (
      <main className="page">
        <Loader />
      </main>
    );
  }

  const isStay = listing.type === LISTING_TYPE.SHORT_STAY;
  const listingUrl = buildRoute(ROUTES.LISTING, { id: listing.id });
  const today = localDate();
  const nights = isStay && form.date && form.checkOut ? nightsBetween(form.date, form.checkOut) : 0;

  // Success screen
  if (booking) {
    return (
      <main className="page">
        <div className="card mx-auto max-w-lg space-y-4 text-center">
          <p className="text-4xl" aria-hidden="true">
            ✓
          </p>
          <h1 className="page-title">Request sent</h1>
          <p className="text-muted">
            {isStay
              ? `Your stay at ${listing.title} from ${booking.date} to ${booking.checkOut} is requested.`
              : `Your viewing of ${listing.title} on ${booking.date} is requested.`}{" "}
            The seller will confirm it soon.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to={ROUTES.HOME}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
            >
              Back to home
            </Link>
            <Link
              to={listingUrl}
              className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-background"
            >
              Back to the property
            </Link>
          </div>
        </div>
      </main>
    );
  }

  function validate() {
    const found = {};
    if (!form.date) found.date = isStay ? "Choose a check-in date" : "Choose a date";
    else if (form.date < today) found.date = "This date has already passed";
    if (isStay) {
      if (!form.checkOut) found.checkOut = "Choose a check-out date";
      else if (form.date && form.checkOut <= form.date) {
        found.checkOut = "Check-out must be after check-in";
      }
    }
    if (form.message.length > MAX_MESSAGE_LENGTH) {
      found.message = `At most ${MAX_MESSAGE_LENGTH} characters`;
    }
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (!tokenStore.get()) {
      navigate(ROUTES.LOGIN); // must be logged in to book
      return;
    }

    setSubmitting(true);
    try {
      const created = await createBooking({
        listingId: listing.id,
        kind: isStay ? BOOKING_KIND.STAY : BOOKING_KIND.VIEWING,
        date: form.date,
        ...(isStay ? { checkOut: form.checkOut } : {}),
        message: form.message.trim() || null,
      });
      setBooking(created);
    } catch (err) {
      if (err.status === 401) navigate(ROUTES.LOGIN);
      else setErrors({ form: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  return (
    <main className="page">
      <div className="mx-auto max-w-lg space-y-6">
        <Link to={listingUrl} className="text-sm text-muted hover:text-primary">
          ‹ Back to the property
        </Link>

        <div>
          <h1 className="page-title">{isStay ? "Book a stay" : "Book a viewing"}</h1>
          <p className="mt-1 text-muted">
            {listing.title} · {formatPrice(listing.price, listing.type)}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="card space-y-4">
          {isStay ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Check-in"
                name="date"
                type="date"
                min={today}
                value={form.date}
                onChange={set("date")}
                error={errors.date}
              />
              <Input
                label="Check-out"
                name="checkOut"
                type="date"
                min={form.date || localDate(1)}
                value={form.checkOut}
                onChange={set("checkOut")}
                error={errors.checkOut}
              />
            </div>
          ) : (
            <Input
              label="Viewing date"
              name="date"
              type="date"
              min={today}
              value={form.date}
              onChange={set("date")}
              error={errors.date}
            />
          )}

          {nights > 0 && (
            <p className="rounded-lg bg-background p-3 text-sm">
              {nights} {nights === 1 ? "night" : "nights"} · about{" "}
              <span className="font-semibold">{formatPrice(Number(listing.price) * nights)}</span>{" "}
              in total
            </p>
          )}

          <label htmlFor="message" className="block">
            <span className="mb-1 block text-sm font-medium">Message to the seller (optional)</span>
            <textarea
              id="message"
              name="message"
              rows={4}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder={isStay ? "How many guests? Arrival time?" : "Best time to visit?"}
              value={form.message}
              onChange={set("message")}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
            />
            {errors.message && (
              <span className="mt-1 block text-sm text-danger">{errors.message}</span>
            )}
          </label>

          {errors.form && <p className="text-sm text-danger">{errors.form}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Sending..." : "Send request"}
          </Button>
          <p className="text-center text-xs text-muted">
            Nothing is paid now. The seller confirms or declines your request.
          </p>
        </form>
      </div>
    </main>
  );
}
