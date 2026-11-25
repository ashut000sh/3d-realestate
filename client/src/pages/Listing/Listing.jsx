// Screen:    Listing
// URL:       ROUTES.LISTING  ("/listings/:id")
// Owner:     M3  (see docs/TEAM.md)
// Wireframe: 6 Listing
// Job:       Photos, price, details, 'Open 3D tour', 'Book viewing', 'Chat with seller'.
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LISTING_TYPE } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import Loader from "../../components/Loader.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { tokenStore } from "../../services/api.js";
import { startConversation } from "../../services/chat.service.js";
import { getListing } from "../../services/listings.service.js";
import { LISTING_TYPE_LABEL, formatPrice } from "../../utils/formatPrice.js";
import { addToCompare, getCompareIds, onCompareChange } from "../Compare/compareStore.js";
import Gallery from "./Gallery.jsx";
import ListingMap from "./ListingMap.jsx";

const LINK_BUTTON = "block rounded-lg px-4 py-2 text-center font-medium transition";

export default function Listing() {
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

  if (loading) {
    return (
      <main className="page">
        <Loader label="Loading property..." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="page space-y-4">
        <h1 className="page-title">
          {error.status === 404 ? "Property not found" : "Couldn't load this property"}
        </h1>
        <p className="text-muted">
          {error.status === 404 ? "It may have been removed or the link is wrong." : error.message}
        </p>
        <Link to={ROUTES.SEARCH} className="font-medium text-primary hover:underline">
          Back to search
        </Link>
      </main>
    );
  }

  const isStay = listing.type === LISTING_TYPE.SHORT_STAY;
  const hasLocation = typeof listing.lat === "number" && typeof listing.lng === "number";
  const facts = [
    listing.bedrooms !== null && { label: "Bedrooms", value: listing.bedrooms },
    listing.bathrooms !== null && { label: "Bathrooms", value: listing.bathrooms },
    listing.areaSqft !== null && {
      label: "Area",
      value: `${new Intl.NumberFormat("en-IN").format(listing.areaSqft)} sq ft`,
    },
    { label: "Type", value: LISTING_TYPE_LABEL[listing.type] ?? listing.type },
  ].filter(Boolean);

  return (
    <main className="page">
      <Link to={ROUTES.SEARCH} className="text-sm text-muted hover:text-primary">
        ‹ Back to search
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Left: photos and details */}
        <div className="space-y-6">
          <Gallery images={listing.images} title={listing.title} />

          <div>
            <h1 className="page-title">{listing.title}</h1>
            <p className="mt-1 text-muted">
              {[listing.address, listing.district].filter(Boolean).join(", ")}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="card p-3">
                <dt className="text-xs text-muted">{fact.label}</dt>
                <dd className="font-semibold">{fact.value}</dd>
              </div>
            ))}
          </dl>

          {listing.description && (
            <section>
              <h2 className="mb-2 text-lg font-semibold">About this property</h2>
              <p className="whitespace-pre-line text-text/90">{listing.description}</p>
            </section>
          )}

          {hasLocation && (
            <section>
              <h2 className="mb-2 text-lg font-semibold">Location</h2>
              <ListingMap lat={listing.lat} lng={listing.lng} />
            </section>
          )}
        </div>

        {/* Right: price and actions (sticks while scrolling on laptop) */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="card space-y-4">
            <p className="text-2xl font-semibold text-primary">
              {formatPrice(listing.price, listing.type)}
            </p>

            {listing.tourUrl ? (
              <Link
                to={buildRoute(ROUTES.TOUR, { id: listing.id })}
                className={`${LINK_BUTTON} bg-primary text-white hover:bg-primary-dark`}
              >
                Open 3D tour
              </Link>
            ) : (
              <Button disabled className="w-full">
                Tour coming soon
              </Button>
            )}

            <Link
              to={buildRoute(ROUTES.BOOKING, { id: listing.id })}
              className={`${LINK_BUTTON} border border-border bg-surface hover:bg-background`}
            >
              {isStay ? "Book a stay" : "Book a viewing"}
            </Link>

            <Button variant="secondary" className="w-full" onClick={handleChat} disabled={chatBusy}>
              {chatBusy ? "Opening chat..." : "Chat with seller"}
            </Button>

            {inCompare ? (
              <Link
                to={ROUTES.COMPARE}
                className="block text-center text-sm font-medium text-primary hover:underline"
              >
                Added to compare. View comparison
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleCompare}
                className="block w-full text-center text-sm font-medium text-primary hover:underline"
              >
                + Add to compare
              </button>
            )}

            {notice && <p className="text-sm text-danger">{notice}</p>}

            {listing.seller && (
              <p className="border-t border-border pt-4 text-sm text-muted">
                Listed by <span className="font-medium text-text">{listing.seller.fullName}</span>
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
