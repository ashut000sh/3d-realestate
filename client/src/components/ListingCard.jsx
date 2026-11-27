// Property card used on Home, Search and Compare. Owner: M3.
// <ListingCard listing={listingSummary} />   (ListingSummary shape: docs/API.md)
// <ListingCardSkeleton />                     grey placeholder while loading
import { Link } from "react-router-dom";
import { ROUTES, buildRoute } from "../constants/routes.js";
import { LISTING_TYPE_LABEL, formatPrice } from "../utils/formatPrice.js";
import { mediaUrl } from "../utils/mediaUrl.js";
import Icon from "./Icon.jsx";
import SaveButton from "./SaveButton.jsx";
import { Skeleton } from "./Loader.jsx";
import Photo from "./Photo.jsx";
import TrustBadges from "./TrustBadges.jsx";

export default function ListingCard({ listing, compact = false }) {
  const cover = mediaUrl(listing.coverImageUrl);

  return (
    <Link
      to={buildRoute(ROUTES.LISTING, { id: listing.id })}
      className="group block animate-fade-up overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-soft)] ring-1 ring-border transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
    >
      <div
        className={`relative overflow-hidden bg-sand ${compact ? "aspect-[16/10]" : "aspect-[4/3]"}`}
      >
        {cover ? (
          <Photo
            src={cover}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted">
            <Icon name="image" className="h-8 w-8 text-border" />
            No photo yet
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />

        <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">
          {LISTING_TYPE_LABEL[listing.type] ?? listing.type}
        </span>
        {listing.hasTour && (
          <span className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            <Icon name="cube" className="h-3.5 w-3.5 text-accent" /> 3D tour
          </span>
        )}
        <SaveButton listingId={listing.id} className="absolute right-3 bottom-3" />
        <p className="absolute bottom-3 left-4 text-lg font-semibold text-white drop-shadow">
          {formatPrice(listing.price, listing.type)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="line-clamp-1 font-semibold text-ink">{listing.title}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <Icon name="pin" className="h-3.5 w-3.5" /> {listing.district}
          </p>
          <TrustBadges
            tourVerified={listing.tourVerified}
            sellerVerified={listing.sellerVerified}
            tipSide="top"
            className="mt-2"
          />
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted transition group-hover:border-primary group-hover:bg-primary group-hover:text-white">
          <Icon name="arrowRight" className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] bg-surface ring-1 ring-border">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
