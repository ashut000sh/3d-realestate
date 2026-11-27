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
import ShareButton from "../../components/ShareButton.jsx";
import { shareLink, shareText } from "../../utils/shareLink.js";
import AreaCard from "./AreaCard.jsx";

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
    listing.bedrooms !== null && { label: "Bedrooms", value: listing.bedrooms },
    listing.bathrooms !== null && { label: "Bathrooms", value: listing.bathrooms },
    { label: listing.floors === 1 ? "Floor" : "Floors", value: listing.floors },
  ].filter(Boolean); // (the type is the chip under the title)
  const tourUrl = buildRoute(ROUTES.TOUR, { id: listing.id });
  const quietAction =
    "flex h-11 items-center gap-2 rounded-lg px-2 text-small font-medium text-text transition-colors hover:bg-sand/70 disabled:opacity-60";

  return (
    <main className="page pt-6">
      <nav className="flex items-center gap-2 text-small text-muted" aria-label="Breadcrumb">
        <Link to={ROUTES.SEARCH} className="hover:text-primary">
          Explore
        </Link>
        <span aria-hidden="true">/</span>
        <Link to={`${ROUTES.SEARCH}?district=${listing.district}`} className="hover:text-primary">
          {listing.district}
        </Link>
      </nav>

      <div className="mt-4">
        <Gallery images={listing.images} title={listing.title} />
      </div>

      {/* Title block, full width */}
      <header className="mt-8 max-w-3xl">
        <h1 className="font-display text-[2rem] leading-[1.12] font-medium tracking-[-0.03em] text-ink sm:text-display">
          {listing.title}
        </h1>
        <p className="mt-2 text-body text-muted">
          {[listing.address, listing.district].filter(Boolean).join(", ")}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone="primary">{LISTING_TYPE_LABEL[listing.type] ?? listing.type}</Badge>
          <TrustBadges
            tourVerified={listing.tourVerified}
            sellerVerified={listing.sellerVerified}
          />
        </div>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
        {/* Price and actions: right column on laptops, straight after the title on phones */}
        <aside className="lg:sticky lg:top-24 lg:order-last lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-small text-muted">
              {isStay
                ? "Per night"
                : listing.type === LISTING_TYPE.RENT
                  ? "Per month"
                  : "Asking price"}
            </p>
            <p className="mt-1 font-display text-title text-ink tabular-nums">
              {formatPrice(listing.price)}
            </p>

            <div className="mt-6 space-y-2.5">
              {listing.tourUrl ? (
                <Button to={tourUrl} size="lg" className="w-full">
                  <Icon name="cube" className="h-5 w-5" /> Open 3D tour
                </Button>
              ) : (
                <p className="rounded-lg bg-sand px-4 py-3 text-center text-small text-muted">
                  3D tour coming soon: our team hasn&apos;t scanned this home yet.
                </p>
              )}
              {isOwner ? (
                <>
                  <Button to={ROUTES.MY_LISTINGS} variant="secondary" size="lg" className="w-full">
                    Manage in My listings
                  </Button>
                  <p className="text-center text-small text-muted">
                    This is your listing. Buyers see &ldquo;Book&rdquo; and &ldquo;Chat&rdquo; here.
                  </p>
                </>
              ) : (
                <Button
                  to={buildRoute(ROUTES.BOOKING, { id: listing.id })}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  {isStay ? "Book a stay" : "Book a viewing"}
                </Button>
              )}
            </div>

            {/* Everything else is quiet: one row of small actions */}
            <div className="mt-4 grid grid-cols-2 gap-x-2 border-t border-border pt-3">
              {!isOwner && (
                <button
                  type="button"
                  onClick={handleChat}
                  disabled={chatBusy}
                  className={quietAction}
                >
                  <Icon name="chat" className="h-4.5 w-4.5" />
                  {chatBusy ? "Opening…" : "Chat with seller"}
                </button>
              )}
              {!isOwner && listing.status === LISTING_STATUS.LIVE && (
                <SaveButton listingId={listing.id} variant="quiet" />
              )}
              {listing.status === LISTING_STATUS.LIVE && (
                <ShareButton
                  variant="quiet"
                  url={shareLink(listing.id)}
                  text={shareText(listing)}
                  title={listing.title}
                />
              )}
              {inCompare ? (
                <Link to={ROUTES.COMPARE} className={`${quietAction} text-primary`}>
                  <Icon name="check" className="h-4.5 w-4.5" /> In compare
                </Link>
              ) : (
                <button type="button" onClick={handleCompare} className={quietAction}>
                  <Icon name="compare" className="h-4.5 w-4.5" /> Compare
                </button>
              )}
            </div>
            {isOwner && listing.status !== LISTING_STATUS.LIVE && (
              <p className="mt-2 text-small text-muted">
                You can share this listing once it&apos;s live.
              </p>
            )}

            {notice && (
              <p className="mt-3 flex items-start gap-2 text-small text-warning" role="alert">
                <Icon name="info" className="mt-0.5 h-4 w-4" /> {notice}
              </p>
            )}

            {listing.seller && (
              <div className="mt-4 flex items-start gap-3 border-t border-border pt-5">
                <Avatar name={listing.seller.fullName} />
                <div className="min-w-0">
                  <p className="text-small text-muted">Listed by</p>
                  <p className="font-medium text-text">{listing.seller.fullName}</p>
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

        {/* Details, set like a brochure: hairlines, not boxes */}
        <div className="min-w-0 space-y-14">
          <dl className="grid grid-cols-3 border-y border-border">
            {facts.map((fact, i) => (
              <div
                key={fact.label}
                className={`py-5 ${i > 0 ? "border-l border-border pl-5" : ""}`}
              >
                <dt className="text-small text-muted">{fact.label}</dt>
                <dd className="mt-1 text-heading font-semibold text-text tabular-nums">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          {listing.areaSqft > 0 && (
            <AreaCard
              areaSqft={listing.areaSqft}
              district={listing.district}
              floors={listing.floors}
            />
          )}

          {listing.description && (
            <section>
              <h2 className="font-display text-heading font-medium text-ink">About this home</h2>
              <p className="mt-3 max-w-[68ch] text-[1.0625rem] leading-7 whitespace-pre-line text-text">
                {listing.description}
              </p>
            </section>
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
      </div>
    </main>
  );
}
