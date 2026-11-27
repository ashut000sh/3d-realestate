// Screen:    Listing
// URL:       ROUTES.LISTING  ("/listings/:id")
// Owner:     M3  (see docs/TEAM.md)
// Wireframe: 6 Listing
// Job:       Photos, price, details, 'Open 3D tour', 'Book viewing', 'Chat with seller'.
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LISTING_STATUS, LISTING_TYPE } from "@realestate/shared";
import Avatar from "../../components/Avatar.jsx";
import Badge from "../../components/Badge.jsx";
import Button from "../../components/Button.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Icon from "../../components/Icon.jsx";
import SaveButton from "../../components/SaveButton.jsx";
import { Skeleton } from "../../components/Loader.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { useAuth } from "../../hooks/useAuth.jsx";
import { tokenStore } from "../../services/api.js";
import { startConversation } from "../../services/chat.service.js";
import { getListing } from "../../services/listings.service.js";
import { LISTING_TYPE_LABEL, formatPrice } from "../../utils/formatPrice.js";
import { addToCompare, getCompareIds, onCompareChange } from "../Compare/compareStore.js";
import Gallery from "./Gallery.jsx";
import NearbySection from "./NearbySection.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { recordView } from "../../services/stats.service.js";
import { VIEW_KIND } from "@realestate/shared";
import TrustBadges, { VerifiedBadge } from "../../components/TrustBadges.jsx";

export default function Listing() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  // loadedId = which listing the data/error belong to. While it differs from the URL's id
  // we are loading (worked out here, not set inside the effect).
  const [loaded, setLoaded] = useState({ loadedId: null, listing: null, error: null });
  const { listing, error } = loaded; // error: { status, message }
  const loading = loaded.loadedId !== id;
  const [chatBusy, setChatBusy] = useState(false);
  const [notice, setNotice] = useState(""); // messages from the chat / compare buttons
  const [inCompare, setInCompare] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getListing(id)
      .then((data) => !cancelled && setLoaded({ loadedId: id, listing: data, error: null }))
      .catch(
        (err) =>
          !cancelled &&
          setLoaded({
            loadedId: id,
            listing: null,
            error: { status: err.status, message: err.message },
          }),
      );
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Seller stats: count this page view (the server ignores repeats within the hour and the owner)
  useEffect(() => {
    recordView(id, VIEW_KIND.PAGE);
  }, [id]);

  // Keep the "Added to compare" state right, even if changed on another page or tab
  useEffect(() => {
    const check = () => setInCompare(getCompareIds().includes(Number(id)));
    check();
    return onCompareChange(check);
  }, [id]);

  async function handleChat() {
    if (!tokenStore.get()) {
      navigate(ROUTES.LOGIN); // must be logged in to chat
      return;
    }
    setChatBusy(true);
    setNotice("");
    try {
      const conversation = await startConversation(listing.id);
      navigate(`${ROUTES.CHAT}?c=${conversation.id}`);
    } catch (err) {
      if (err.status === 401) navigate(ROUTES.LOGIN);
      else setNotice(err.message);
    } finally {
      setChatBusy(false);
    }
  }

  function handleCompare() {
    const result = addToCompare(listing.id);
    setNotice(result.ok ? "" : result.error);
  }

  usePageTitle(listing?.title ?? "Home details");

  if (loading) {
    return (
      <main className="page space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-[460px] rounded-[28px]" />
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-80" />
        </div>
      </main>
    );
  }

  if (error) {
    const notFound = error.status === 404;
    return (
      <main className="page">
        <EmptyState
          icon={notFound ? "home" : "alert"}
          tone={notFound ? "neutral" : "danger"}
          title={notFound ? "Property not found" : "Couldn't load this property"}
          text={notFound ? "It may have been removed, or the link is wrong." : error.message}
          action={<Button to={ROUTES.SEARCH}>Explore other homes</Button>}
        />
      </main>
    );
  }

  const isStay = listing.type === LISTING_TYPE.SHORT_STAY;
  // The seller looking at their own listing manages it instead of booking or chatting
  const isOwner = Boolean(user && listing.seller && user.id === listing.seller.id);
  const hasLocation = typeof listing.lat === "number" && typeof listing.lng === "number";
  const facts = [
    listing.bedrooms !== null && { icon: "bed", label: "Bedrooms", value: listing.bedrooms },
    listing.bathrooms !== null && { icon: "bath", label: "Bathrooms", value: listing.bathrooms },
    listing.areaSqft !== null && {
      icon: "area",
      label: "Area",
      value: `${new Intl.NumberFormat("en-IN").format(listing.areaSqft)} sq ft`,
    },
    { icon: "home", label: "Type", value: LISTING_TYPE_LABEL[listing.type] ?? listing.type },
  ].filter(Boolean);

  const tourBadge = listing.tourUrl && (
    <Link
      to={buildRoute(ROUTES.TOUR, { id: listing.id })}
      className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-ink/90 py-2 pr-4 pl-2 text-sm font-semibold text-white shadow-[var(--shadow-lift)] backdrop-blur transition hover:bg-ink"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-ink">
        <Icon name="cube" className="h-4 w-4" />
      </span>
      Open 3D tour
    </Link>
  );

  return (
    <main className="page pt-6">
      <nav className="flex items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
        <Link to={ROUTES.SEARCH} className="flex items-center gap-1 hover:text-primary">
          <Icon name="arrowLeft" className="h-4 w-4" /> Explore
        </Link>
        <span>/</span>
        <Link to={`${ROUTES.SEARCH}?district=${listing.district}`} className="hover:text-primary">
          {listing.district}
        </Link>
      </nav>

      <div className="mt-4">
        <Gallery images={listing.images} title={listing.title} badge={tourBadge} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Left: details */}
        <div className="min-w-0 space-y-10">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="primary">{LISTING_TYPE_LABEL[listing.type] ?? listing.type}</Badge>
              {listing.tourUrl ? (
                <Badge tone="gold">
                  <Icon name="cube" className="h-3.5 w-3.5" /> 3D tour available
                </Badge>
              ) : (
                <Badge>3D tour coming soon</Badge>
              )}
              <TrustBadges
                tourVerified={listing.tourVerified}
                sellerVerified={listing.sellerVerified}
                size="md"
              />
            </div>
            <h1 className="display mt-4 text-3xl leading-tight text-ink sm:text-[2.6rem]">
              {listing.title}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-muted">
              <Icon name="pin" className="h-4 w-4" />
              {[listing.address, listing.district].filter(Boolean).join(", ")}
            </p>
          </header>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="rounded-2xl bg-surface p-4 ring-1 ring-border">
                <Icon name={fact.icon} className="h-5 w-5 text-accent-dark" />
                <dd className="mt-3 text-lg font-semibold text-ink">{fact.value}</dd>
                <dt className="text-sm text-muted">{fact.label}</dt>
              </div>
            ))}
          </dl>

          {listing.description && (
            <section>
              <h2 className="display text-2xl text-ink">About this home</h2>
              <p className="mt-3 text-[17px] leading-relaxed whitespace-pre-line text-text/85">
                {listing.description}
              </p>
            </section>
          )}

          {listing.tourUrl && (
            <Link
              to={buildRoute(ROUTES.TOUR, { id: listing.id })}
              className="grain group relative flex items-center gap-6 overflow-hidden rounded-[24px] bg-ink p-6 text-white sm:p-8"
            >
              <div className="absolute -right-16 -bottom-20 h-64 w-64 rounded-full bg-primary/60 blur-3xl" />
              <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent text-ink transition group-hover:scale-105">
                <Icon name="cube" className="h-8 w-8" />
              </span>
              <span className="relative">
                <span className="display block text-2xl">Walk through it in 3D</span>
                <span className="mt-1 block text-white/70">
                  Look around every room and measure walls, right in your browser.
                </span>
              </span>
              <Icon
                name="arrowRight"
                className="relative ml-auto hidden h-6 w-6 text-accent transition group-hover:translate-x-1 sm:block"
              />
            </Link>
          )}

          {hasLocation && (
            <NearbySection
              key={listing.id}
              listingId={listing.id}
              lat={listing.lat}
              lng={listing.lng}
              district={listing.district}
            />
          )}
        </div>

        {/* Right: price and actions (sticks while scrolling on laptop) */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-5 p-6">
            <div>
              <p className="text-sm text-muted">
                {isStay
                  ? "Per night"
                  : listing.type === LISTING_TYPE.RENT
                    ? "Per month"
                    : "Asking price"}
              </p>
              <p className="display mt-1 text-3xl text-ink">{formatPrice(listing.price)}</p>
            </div>

            <div className="space-y-2.5">
              {listing.tourUrl ? (
                <Button
                  to={buildRoute(ROUTES.TOUR, { id: listing.id })}
                  size="lg"
                  className="w-full"
                >
                  <Icon name="cube" className="h-5 w-5" /> Open 3D tour
                </Button>
              ) : (
                <Button disabled size="lg" variant="secondary" className="w-full">
                  <Icon name="clock" className="h-5 w-5" /> Tour coming soon
                </Button>
              )}
              {isOwner ? (
                <>
                  <Button to={ROUTES.MY_LISTINGS} variant="gold" size="lg" className="w-full">
                    <Icon name="key" className="h-5 w-5" /> Manage in My listings
                  </Button>
                  <p className="text-center text-sm text-muted">
                    This is your listing. Buyers see "Book" and "Chat" here.
                  </p>
                </>
              ) : (
                <>
                  <Button
                    to={buildRoute(ROUTES.BOOKING, { id: listing.id })}
                    variant="gold"
                    size="lg"
                    className="w-full"
                  >
                    <Icon name="calendar" className="h-5 w-5" />{" "}
                    {isStay ? "Book a stay" : "Book a viewing"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    onClick={handleChat}
                    loading={chatBusy}
                  >
                    <Icon name="chat" className="h-5 w-5" />{" "}
                    {chatBusy ? "Opening chat..." : "Chat with seller"}
                  </Button>
                  {listing.status === LISTING_STATUS.LIVE && (
                    <SaveButton listingId={listing.id} variant="labelled" className="w-full" />
                  )}
                </>
              )}
            </div>

            {inCompare ? (
              <Link
                to={ROUTES.COMPARE}
                className="flex items-center justify-center gap-2 rounded-xl bg-success-soft px-4 py-2.5 text-sm font-semibold text-success"
              >
                <Icon name="check" className="h-4 w-4" /> Added to compare. View comparison
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleCompare}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary-soft/50"
              >
                <Icon name="plus" className="h-4 w-4" /> Add to compare
              </button>
            )}

            {notice && (
              <p
                className="flex items-start gap-2 rounded-xl bg-warning-soft px-3 py-2.5 text-sm text-warning"
                role="alert"
              >
                <Icon name="info" className="mt-0.5 h-4 w-4" /> {notice}
              </p>
            )}

            {listing.seller && (
              <div className="flex items-start gap-3 border-t border-border pt-5">
                <Avatar name={listing.seller.fullName} />
                <div className="min-w-0">
                  <p className="text-xs text-muted">Listed by</p>
                  <p className="font-semibold text-ink">{listing.seller.fullName}</p>
                  {(listing.seller.verified || listing.seller.emailVerified) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {listing.seller.verified && (
                        <VerifiedBadge kind="seller" tipSide="top" tipAlign="end" />
                      )}
                      {listing.seller.emailVerified && (
                        <VerifiedBadge kind="email" tipSide="top" tipAlign="end" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
