// Property card used on Home, Search and Compare. Owner: M3.
// <ListingCard listing={listingSummary} />   (ListingSummary shape: docs/API.md)
import { Link } from "react-router-dom";
import { ROUTES, buildRoute } from "../constants/routes.js";
import { LISTING_TYPE_LABEL, formatPrice } from "../utils/formatPrice.js";
import { mediaUrl } from "../utils/mediaUrl.js";

export default function ListingCard({ listing }) {
  const cover = mediaUrl(listing.coverImageUrl);

  return (
    <Link
      to={buildRoute(ROUTES.LISTING, { id: listing.id })}
      className="card group block overflow-hidden p-0 transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-background">
        {cover ? (
          <img
            src={cover}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No photo yet
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-medium">
          {LISTING_TYPE_LABEL[listing.type] ?? listing.type}
        </span>
        {listing.hasTour && (
          <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white">
            3D tour
          </span>
        )}
      </div>

      <div className="space-y-1 p-4">
        <p className="font-semibold text-primary">{formatPrice(listing.price, listing.type)}</p>
        <h3 className="line-clamp-1 font-medium">{listing.title}</h3>
        <p className="text-sm text-muted">{listing.district}</p>
      </div>
    </Link>
  );
}
