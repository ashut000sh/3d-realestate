// Screen:    Compare
// URL:       ROUTES.COMPARE  ("/compare")
// Owner:     M3  (see docs/TEAM.md)
// Wireframe: 8 Compare
// Job:       Side-by-side table of up to 3 properties chosen with "Add to compare".
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LIMITS } from "@realestate/shared";
import Loader from "../../components/Loader.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { compareListings } from "../../services/listings.service.js";
import { LISTING_TYPE_LABEL, formatPrice } from "../../utils/formatPrice.js";
import { mediaUrl } from "../../utils/mediaUrl.js";
import { getCompareIds, onCompareChange, removeFromCompare } from "./compareStore.js";

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
    cell: (l) =>
      l.areaSqft === null ? "–" : `${new Intl.NumberFormat("en-IN").format(l.areaSqft)} sq ft`,
  },
  {
    label: "3D tour",
    cell: (l) =>
      l.tourUrl ? (
        <Link
          to={buildRoute(ROUTES.TOUR, { id: l.id })}
          className="font-medium text-primary hover:underline"
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
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(ids.length > 0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Follow changes made on other pages or tabs
  useEffect(() => onCompareChange(() => setIds(getCompareIds())), []);

  const idsKey = ids.join(",");
  useEffect(() => {
    if (ids.length === 0) {
      setListings([]);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    compareListings(ids)
      .then((items) => {
        if (cancelled) return;
        setListings(items);
        // Properties that are no longer live come back missing: drop them from the list
        const missing = ids.filter((id) => !items.some((item) => item.id === id));
        if (missing.length > 0) {
          missing.forEach(removeFromCompare);
          setNotice("Some properties are no longer available and were removed.");
        }
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // idsKey covers the ids array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  if (loading) {
    return (
      <main className="page">
        <Loader label="Loading comparison..." />
      </main>
    );
  }

  return (
    <main className="page space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="page-title">Compare properties</h1>
        <p className="text-sm text-muted">
          {listings.length} of {LIMITS.MAX_COMPARE} chosen
        </p>
      </div>

      {notice && <p className="card text-sm text-muted">{notice}</p>}
      {error && <p className="card text-danger">Couldn't load the comparison: {error}</p>}

      {!error && listings.length === 0 ? (
        <div className="card space-y-3 text-center">
          <p className="font-medium">Nothing to compare yet</p>
          <p className="text-muted">
            Open a property and press "Add to compare". You can compare up to {LIMITS.MAX_COMPARE}.
          </p>
          <Link
            to={ROUTES.SEARCH}
            className="inline-block font-medium text-primary hover:underline"
          >
            Find properties
          </Link>
        </div>
      ) : (
        !error && (
          // Wide table scrolls sideways on phones
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[560px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-32" />
                {listings.map((l) => (
                  <col key={l.id} />
                ))}
              </colgroup>
              <thead>
                <tr className="align-top">
                  <td className="p-4" />
                  {listings.map((l) => (
                    <th key={l.id} scope="col" className="space-y-2 p-4 font-normal">
                      <Link
                        to={buildRoute(ROUTES.LISTING, { id: l.id })}
                        className="block space-y-2"
                      >
                        <div className="aspect-[4/3] overflow-hidden rounded-lg bg-background">
                          {l.images?.[0] ? (
                            <img
                              src={mediaUrl(l.images[0])}
                              alt={l.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted">
                              No photo
                            </div>
                          )}
                        </div>
                        <span className="line-clamp-2 font-semibold hover:text-primary">
                          {l.title}
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromCompare(l.id)}
                        className="text-sm text-danger hover:underline"
                      >
                        Remove
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-t border-border">
                    <th scope="row" className="p-4 text-sm font-medium text-muted">
                      {row.label}
                    </th>
                    {listings.map((l) => (
                      <td key={l.id} className="p-4">
                        {row.cell(l)}
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
