// Property card used on Home, Search, Saved and Compare. Owner: M3.
// <ListingCard listing={listingSummary} />   (ListingSummary shape: docs/API.md)
// <ListingCard listing highlighted onHover={(id | null) => ...} />   map <-> card highlight
// <ListingCardSkeleton />                     ivory placeholder while loading
//
// Design v2: the photo is the card. No border box, no shadow, no arrow button. Under it:
// title, place · area, price. One chip on the photo only when it means something (3D tour).
import { Link } from "react-router-dom";
import { formatAreaShort } from "@realestate/shared";
import { ROUTES, buildRoute } from "../constants/routes.js";
import { LISTING_TYPE_LABEL, formatPrice } from "../utils/formatPrice.js";
import { mediaUrl } from "../utils/mediaUrl.js";
import Icon from "./Icon.jsx";
import Photo from "./Photo.jsx";
import SaveButton from "./SaveButton.jsx";
import { Skeleton } from "./Loader.jsx";
import TrustBadges from "./TrustBadges.jsx";

export default function ListingCard({ listing, compact = false, highlighted = false, onHover }) {
  const cover = mediaUrl(listing.coverImageUrl);
  const hover = onHover
    ? {
        onMouseEnter: () => onHover(listing.id),
        onMouseLeave: () => onHover(null),
        onFocus: () => onHover(listing.id),
        onBlur: () => onHover(null),
      }
    : {};

  return (
    <Link
      to={buildRoute(ROUTES.LISTING, { id: listing.id })}
      className="group block rounded-xl outline-offset-4"
      {...hover}
    >
      <div
        className={`relative overflow-hidden rounded-xl bg-sand transition-shadow duration-200 ${
          compact ? "aspect-[16/10]" : "aspect-[4/3]"
        } ${highlighted ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
      >
        {cover ? (
          <Photo
            src={cover}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-small text-muted">
            No photo yet
          </div>
        )}
        {listing.hasTour && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-ink/90 px-2.5 py-1 text-label font-semibold tracking-normal text-white">
            <Icon name="cube" className="h-3.5 w-3.5 text-accent" /> 3D tour
          </span>
        )}
        <SaveButton listingId={listing.id} className="absolute top-2 right-2" />
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate text-body font-medium text-text group-hover:text-primary">
          {listing.title}
        </h3>
      </div>
      <p className="mt-0.5 truncate text-small text-muted">
        {LISTING_TYPE_LABEL[listing.type] ?? listing.type} · {listing.district} ·{" "}
        {formatAreaShort(listing.areaSqft, listing.district)}
      </p>
      <p className="mt-1.5 text-body font-semibold text-text tabular-nums">
        {formatPrice(listing.price, listing.type)}
      </p>
      <TrustBadges
        tourVerified={listing.tourVerified}
        sellerVerified={listing.sellerVerified}
        tipSide="top"
        className="mt-2"
      />
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="aspect-[4/3] rounded-xl" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
      <Skeleton className="mt-2 h-4 w-1/3" />
    </div>
  );
}
