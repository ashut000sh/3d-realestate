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
import Badge from "../../components/Badge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Icon from "../../components/Icon.jsx";
import Input, { Textarea } from "../../components/Input.jsx";
import { Skeleton } from "../../components/Loader.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { tokenStore } from "../../services/api.js";
import { getListing } from "../../services/listings.service.js";
import { formatPrice } from "../../utils/formatPrice.js";
import { mediaUrl } from "../../utils/mediaUrl.js";
import Photo from "../../components/Photo.jsx";
import StayCalendar from "../../components/StayCalendar.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { createBooking, getAvailability } from "../../services/bookings.service.js";
import { addMonths } from "../../utils/dates.js";

// "2026-12-20" -> "Sun, 20 Dec 2026"
const prettyDate = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

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
  // Short stays: booked dates for the calendar. loadedKey !== the wanted key = still loading.
  const [availability, setAvailability] = useState({ loadedKey: null, blocked: [], error: "" });
  const [availabilityVersion, setAvailabilityVersion] = useState(0); // bump to reload

  useEffect(() => {
    let cancelled = false;
    getListing(id)
      .then((data) => !cancelled && setListing(data))
      .catch((err) => !cancelled && setLoadError({ status: err.status, message: err.message }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const stayListingId = listing && listing.type === LISTING_TYPE.SHORT_STAY ? listing.id : null;
  const availabilityKey = stayListingId ? `${stayListingId}:${availabilityVersion}` : null;
  // Calendar window: today to 12 months ahead (the most the API gives in one request)
  const windowFrom = localDate();
  const windowTo = addMonths(windowFrom, 12);

  useEffect(() => {
    if (!availabilityKey) return undefined;
    let cancelled = false;
    getAvailability(stayListingId, { from: windowFrom, to: windowTo })
      .then(
        (data) =>
          !cancelled &&
          setAvailability({ loadedKey: availabilityKey, blocked: data.blocked, error: "" }),
      )
      .catch(
        (err) =>
          !cancelled &&
          setAvailability({ loadedKey: availabilityKey, blocked: [], error: err.message }),
      );
    return () => {
      cancelled = true;
    };
    // the key covers the listing and reloads; the window only changes at midnight
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availabilityKey]);
  const availabilityLoading = availability.loadedKey !== availabilityKey;

  usePageTitle(listing ? `Book · ${listing.title}` : "Book");

  if (loadError) {
    const notFound = loadError.status === 404;
    return (
      <main className="page">
        <EmptyState
          icon={notFound ? "home" : "alert"}
          tone={notFound ? "neutral" : "danger"}
          title={notFound ? "Property not found" : "Couldn't load this property"}
          text={notFound ? "It may have been removed, or the link is wrong." : loadError.message}
          action={<Button to={ROUTES.SEARCH}>Explore other homes</Button>}
        />
      </main>
    );
  }
  if (!listing) {
    return (
      <main className="page grid gap-8 lg:grid-cols-[1fr_400px]">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
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
        <div className="card mx-auto max-w-xl animate-scale-in p-8 text-center sm:p-12">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-soft text-success">
            <Icon name="check" className="h-10 w-10" strokeWidth={2.5} />
          </span>
          <h1 className="display mt-6 text-3xl text-ink">Request sent</h1>
          <p className="mt-3 text-muted">
            The seller will confirm it soon. We'll keep it in your messages too.
          </p>

          <div className="mt-8 flex items-center gap-4 rounded-2xl bg-sand/60 p-4 text-left">
            {listing.images?.[0] && (
              <Photo
                src={mediaUrl(listing.images[0])}
                alt=""
                className="h-16 w-20 rounded-xl object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{listing.title}</p>
              <p className="text-sm text-muted">
                {isStay
                  ? `${prettyDate(booking.date)} → ${prettyDate(booking.checkOut)}`
                  : prettyDate(booking.date)}
              </p>
            </div>
            <Badge tone="warning" dot className="ml-auto">
              Requested
            </Badge>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button to={ROUTES.HOME}>Back to home</Button>
            <Button to={listingUrl} variant="secondary">
              Back to the property
            </Button>
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
      else if (err.status === 409 && isStay) {
        // Someone else got these nights first: show the fresh calendar and ask again
        setErrors({
          form: `${err.message}. The calendar has been updated, please pick new dates.`,
        });
        setForm((f) => ({ ...f, checkOut: "" }));
        setAvailabilityVersion((v) => v + 1);
      } else setErrors({ form: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  return (
    <main className="page">
      <Link
        to={listingUrl}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary"
      >
        <Icon name="arrowLeft" className="h-4 w-4" /> Back to the property
      </Link>

      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div>
          <p className="eyebrow">{isStay ? "Short stay" : "Viewing"}</p>
          <h1 className="page-title mt-2">{isStay ? "Book your stay" : "Book a viewing"}</h1>
          <p className="mt-2 text-muted">
            {isStay
              ? "Pick your dates. The host confirms before anything is final."
              : "Choose a day to visit. The seller confirms the time with you."}
          </p>

          <form onSubmit={handleSubmit} noValidate className="card mt-8 space-y-6 p-6 sm:p-8">
            {isStay ? (
              <div>
                <p className="label">Your dates</p>
                {availabilityLoading ? (
                  <div className="grid gap-8 md:grid-cols-2" aria-busy="true">
                    {[0, 1].map((i) => (
                      <div key={i} className={`space-y-3 ${i ? "hidden md:block" : ""}`}>
                        <Skeleton className="mx-auto h-5 w-32" />
                        <Skeleton className="h-64" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {availability.error && (
                      <p className="mb-4 flex items-start gap-2 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
                        <Icon name="info" className="mt-0.5 h-4 w-4" />
                        Couldn't load booked dates ({availability.error}). You can still send a
                        request; the host checks the dates.
                      </p>
                    )}
                    <StayCalendar
                      blocked={availability.blocked}
                      checkIn={form.date || null}
                      checkOut={form.checkOut || null}
                      maxDate={windowTo}
                      onChange={({ checkIn, checkOut }) => {
                        setForm((f) => ({ ...f, date: checkIn ?? "", checkOut: checkOut ?? "" }));
                        setErrors((e) => ({ ...e, date: undefined, checkOut: undefined }));
                      }}
                    />
                  </>
                )}
                {(errors.date || errors.checkOut) && (
                  <p className="mt-3 flex items-center gap-1 text-sm text-danger">
                    <Icon name="alert" className="h-3.5 w-3.5" /> {errors.date || errors.checkOut}
                  </p>
                )}
              </div>
            ) : (
              <Input
                label="Viewing date"
                name="date"
                type="date"
                icon="calendar"
                min={today}
                value={form.date}
                onChange={set("date")}
                error={errors.date}
              />
            )}

            <Textarea
              label="Message to the seller (optional)"
              name="message"
              id="message"
              rows={4}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder={isStay ? "How many guests? Arrival time?" : "Best time to visit?"}
              value={form.message}
              onChange={set("message")}
              error={errors.message}
              hint={`${form.message.length} / ${MAX_MESSAGE_LENGTH}`}
            />

            {errors.form && (
              <p
                className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger"
                role="alert"
              >
                <Icon name="alert" className="h-4 w-4" /> {errors.form}
              </p>
            )}

            {isStay && nights > 0 && (
              <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-accent-soft px-4 py-3">
                <span className="text-sm text-accent-dark">
                  {nights} {nights === 1 ? "night" : "nights"} × {formatPrice(listing.price)}
                </span>
                <span className="display text-xl text-ink">
                  {formatPrice(Number(listing.price) * nights)}
                </span>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={submitting}>
              {submitting ? "Sending..." : isStay ? "Request booking" : "Send request"}
            </Button>
            <p className="flex items-center justify-center gap-2 text-center text-xs text-muted">
              <Icon name="shield" className="h-4 w-4" /> Nothing is paid now. The seller confirms or
              declines your request.
            </p>
          </form>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden p-0">
            {listing.images?.[0] && (
              <Photo
                src={mediaUrl(listing.images[0])}
                alt={listing.title}
                className="aspect-[16/10] w-full object-cover"
              />
            )}
            <div className="space-y-4 p-6">
              <div>
                <p className="font-semibold text-ink">{listing.title}</p>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                  <Icon name="pin" className="h-3.5 w-3.5" /> {listing.district}
                </p>
              </div>
              <div className="space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Price</span>
                  <span className="font-medium">{formatPrice(listing.price, listing.type)}</span>
                </div>
                {isStay && (
                  <div className="flex justify-between">
                    <span className="text-muted">Nights</span>
                    <span className="font-medium">{nights || "–"}</span>
                  </div>
                )}
                {!isStay && form.date && (
                  <div className="flex justify-between">
                    <span className="text-muted">Visit</span>
                    <span className="font-medium">{prettyDate(form.date)}</span>
                  </div>
                )}
              </div>
              {nights > 0 && (
                <div className="flex items-baseline justify-between rounded-xl bg-accent-soft px-4 py-3">
                  <span className="text-sm font-medium text-accent-dark">
                    {nights} {nights === 1 ? "night" : "nights"} · about
                  </span>
                  <span className="display text-xl text-ink">
                    {formatPrice(Number(listing.price) * nights)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
