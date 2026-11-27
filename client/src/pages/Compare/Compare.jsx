// Screen:    Compare
// URL:       ROUTES.COMPARE  ("/compare")
// Owner:     M3  (see docs/TEAM.md)
// Wireframe: 8 Compare
// Job:       Side-by-side table of up to 3 properties chosen with "Add to compare".
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LIMITS, formatAreaShort } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Icon from "../../components/Icon.jsx";
import { Skeleton } from "../../components/Loader.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { compareListings } from "../../services/listings.service.js";
import { LISTING_TYPE_LABEL, formatPrice } from "../../utils/formatPrice.js";
import { mediaUrl } from "../../utils/mediaUrl.js";
import { getCompareIds, onCompareChange, removeFromCompare } from "./compareStore.js";
import Photo from "../../components/Photo.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";

const show = (value) => (value === null || value === undefined ? "–" : value);

// One row per fact. Each row turns a Listing into what its cell shows.
const ROWS = [
  { label: "Price", cell: (l) => formatPrice(l.price, l.type) },
  { label: "Type", cell: (l) => LISTING_TYPE_LABEL[l.type] ?? l.type },
  { label: "District", cell: (l) => l.district },
  { label: "Bedrooms", cell: (l) => show(l.bedrooms) },
  { label: "Bathrooms", cell: (l) => show(l.bathrooms) },
  {
    label: "Area",
    cell: (l) => formatAreaShort(l.areaSqft, l.district),
  },
  { label: "Floors", cell: (l) => show(l.floors) },
  {
    label: "3D tour",
    cell: (l) =>
      l.tourUrl ? (
        <Link
          to={buildRoute(ROUTES.TOUR, { id: l.id })}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-dark hover:bg-accent hover:text-ink"
        >
          Yes, open tour
        </Link>
      ) : (
        <span className="text-muted">Not yet</span>
      ),
  },
];

export default function Compare() {
  const [ids, setIds] = useState(getCompareIds);
  // loadedKey = which ids the data/error belong to (worked out below, not set inside the effect)
  const [loaded, setLoaded] = useState({ loadedKey: null, listings: [], error: "" });
  const [notice, setNotice] = useState("");

  // Follow changes made on other pages or tabs
  useEffect(() => onCompareChange(() => setIds(getCompareIds())), []);

  const idsKey = ids.join(",");
  const isFresh = loaded.loadedKey === idsKey;
  // Only show chosen properties. After "Remove" the rest are already here, so no loader.
  const listings = loaded.listings.filter((listing) => ids.includes(listing.id));
  const error = isFresh ? loaded.error : "";
  const loading = !isFresh && ids.some((id) => !listings.some((listing) => listing.id === id));

  useEffect(() => {
    if (ids.length === 0) return undefined;
    let cancelled = false;
    compareListings(ids)
      .then((items) => {
        if (cancelled) return;
        setLoaded({ loadedKey: idsKey, listings: items, error: "" });
        // Properties that are no longer live come back missing: drop them from the list
        const missing = ids.filter((id) => !items.some((item) => item.id === id));
        if (missing.length > 0) {
          missing.forEach(removeFromCompare);
          setNotice("Some properties are no longer available and were removed.");
        }
      })
      .catch(
        (err) =>
          !cancelled && setLoaded((prev) => ({ ...prev, loadedKey: idsKey, error: err.message })),
      );
    return () => {
      cancelled = true;
    };
    // idsKey covers the ids array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  usePageTitle("Compare homes");

  if (loading) {
    return (
      <main className="page space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </main>
    );
  }

  const emptySlots = Math.max(0, LIMITS.MAX_COMPARE - listings.length);

  return (
    <main className="page space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Side by side</p>
          <h1 className="page-title mt-2">Compare homes</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm ring-1 ring-border">
          <span className="flex gap-1">
            {Array.from({ length: LIMITS.MAX_COMPARE }, (_, i) => (
              <span
                key={i}
                className={`h-2 w-5 rounded-full ${i < listings.length ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </span>
          <span className="font-medium text-muted">
            <span className="text-ink">{listings.length}</span> of {LIMITS.MAX_COMPARE} chosen
          </span>
        </div>
      </div>

      {notice && (
        <p className="flex items-center gap-2 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
          <Icon name="info" className="h-4 w-4" /> {notice}
        </p>
      )}
      {error && (
        <EmptyState icon="alert" tone="danger" title="Couldn't load the comparison" text={error} />
      )}

      {!error && listings.length === 0 ? (
        <EmptyState
          icon="compare"
          title="Nothing to compare yet"
          text={`Open any home and press “Add to compare”. You can compare up to ${LIMITS.MAX_COMPARE} side by side.`}
          action={<Button to={ROUTES.SEARCH}>Find homes to compare</Button>}
        />
      ) : (
        !error && (
          // Wide table scrolls sideways on phones instead of squashing
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-40" />
                {listings.map((l) => (
                  <col key={l.id} />
                ))}
                {Array.from({ length: emptySlots }, (_, i) => (
                  <col key={`empty-${i}`} />
                ))}
              </colgroup>
              <thead>
                <tr className="align-top">
                  <td className="p-5 align-bottom">
                    <p className="text-sm text-muted">Pick the one that fits you best.</p>
                  </td>
                  {listings.map((l) => (
                    <th key={l.id} scope="col" className="p-4 font-normal">
                      <div className="group relative">
                        <Link to={buildRoute(ROUTES.LISTING, { id: l.id })} className="block">
                          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-sand">
                            {l.images?.[0] ? (
                              <Photo
                                src={mediaUrl(l.images[0])}
                                alt={l.title}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-sm text-muted">
                                No photo
                              </div>
                            )}
                          </div>
                          <span className="mt-3 line-clamp-2 font-semibold text-ink group-hover:text-primary">
                            {l.title}
                          </span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromCompare(l.id)}
                          aria-label={`Remove ${l.title}`}
                          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-muted shadow hover:text-danger"
                        >
                          <Icon name="x" className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCompare(l.id)}
                          className="mt-1 text-sm font-medium text-muted hover:text-danger"
                        >
                          Remove
                        </button>
                      </div>
                    </th>
                  ))}
                  {Array.from({ length: emptySlots }, (_, i) => (
                    <th key={`empty-${i}`} scope="col" className="p-4 font-normal">
                      <Link
                        to={ROUTES.SEARCH}
                        className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-sm font-semibold text-muted transition hover:border-primary hover:text-primary"
                      >
                        <Icon name="plus" className="h-6 w-6" />
                        Add a home
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-sand/45" : ""}>
                    <th scope="row" className="px-5 py-4 text-sm font-medium text-muted">
                      {row.label}
                    </th>
                    {listings.map((l) => (
                      <td key={l.id} className="px-4 py-4 font-medium text-ink">
                        {row.cell(l)}
                      </td>
                    ))}
                    {Array.from({ length: emptySlots }, (_, j) => (
                      <td key={`empty-${j}`} className="px-4 py-4 text-border">
                        –
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </main>
  );
}
