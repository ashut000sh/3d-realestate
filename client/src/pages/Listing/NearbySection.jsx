// "Where it is" + "What's nearby" on the Listing page.
// Map with category markers (chips above it show/hide each category), then a list grouped by
// category with distance and walking time. Data: GET /api/listings/:id/nearby (OpenStreetMap).
// <NearbySection listingId={7} lat={27.71} lng={85.32} district="Kathmandu" />
import { useEffect, useState } from "react";
import { NEARBY } from "@realestate/shared";
import Icon from "../../components/Icon.jsx";
import { Skeleton } from "../../components/Loader.jsx";
import { getNearbyPlaces } from "../../services/listings.service.js";
import ListingMap from "./ListingMap.jsx";
import { CATEGORIES, formatDistance, walkTime } from "./nearbyCategories.js";

const SHOWN_PER_GROUP = 3; // the rest behind "Show all"

export default function NearbySection({ listingId, lat, lng, district }) {
  // loadedId = which listing the data belongs to; different from listingId = loading
  const [loaded, setLoaded] = useState({ loadedId: null, items: [], message: null, error: "" });
  const [hidden, setHidden] = useState(() => new Set()); // categories switched off
  const [expanded, setExpanded] = useState(() => new Set()); // groups showing every place
  const loading = loaded.loadedId !== listingId;

  useEffect(() => {
    let cancelled = false;
    getNearbyPlaces(listingId)
      .then(
        (data) =>
          !cancelled &&
          setLoaded({ loadedId: listingId, items: data.items, message: data.message, error: "" }),
      )
      .catch(
        (err) =>
          !cancelled &&
          setLoaded({ loadedId: listingId, items: [], message: null, error: err.message }),
      );
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const { items, message, error } = loaded;
  const groups = CATEGORIES.map((c) => ({
    ...c,
    places: items.filter((p) => p.category === c.key),
  })).filter((g) => g.places.length > 0);
  const visiblePlaces = items.filter((p) => !hidden.has(p.category));

  const toggle = (setter, key) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <section>
      <h2 className="display text-2xl text-ink">Where it is</h2>
      <p className="mt-1 text-muted">
        {district}, Nepal · places within {NEARBY.RADIUS_METERS / 1000} km
      </p>

      {/* Category chips: show/hide markers on the map */}
      {!loading && groups.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Show on map">
          {groups.map((g) => {
            const on = !hidden.has(g.key);
            return (
              <button
                key={g.key}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(setHidden, g.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  on
                    ? "border-transparent bg-ink text-white"
                    : "border-border bg-surface text-muted hover:text-ink"
                }`}
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                  style={{ background: on ? g.color : "#b9bdb9" }}
                >
                  <Icon name={g.icon} className="h-3 w-3" strokeWidth={2.4} />
                </span>
                {g.label}
                <span className={on ? "text-white/60" : "text-muted/70"}>{g.places.length}</span>
              </button>
            );
          })}
        </div>
      )}
      {loading && (
        <div className="mt-4 flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full" />
          ))}
        </div>
      )}

      <div className="mt-4">
        <ListingMap lat={lat} lng={lng} places={loading ? [] : visiblePlaces} />
      </div>

      <h3 className="display mt-10 text-xl text-ink">What's nearby</h3>
      {loading ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card space-y-3 p-5">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          <Icon name="alert" className="mt-0.5 h-4 w-4" /> Couldn't load nearby places: {error}
        </p>
      ) : groups.length === 0 ? (
        <div className="mt-3 flex items-start gap-3 rounded-2xl bg-sand/70 p-5 text-muted">
          <Icon name="map" className="mt-0.5 h-5 w-5 text-accent-dark" />
          <div>
            <p className="font-semibold text-ink">No nearby data yet</p>
            <p className="text-sm">
              {message ?? "OpenStreetMap has no schools, shops or bus stops mapped close to here."}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {groups.map((g) => {
            const open = expanded.has(g.key);
            const shown = open ? g.places : g.places.slice(0, SHOWN_PER_GROUP);
            return (
              <div key={g.key} className="card min-w-0 p-5">
                <p className="flex items-center gap-2.5 font-semibold text-ink">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
                    style={{ background: g.color }}
                  >
                    <Icon name={g.icon} className="h-4 w-4" />
                  </span>
                  {g.label}
                </p>
                <ul className="mt-3 divide-y divide-border">
                  {shown.map((p) => (
                    <li
                      key={`${p.lat}-${p.lng}`}
                      className="flex items-baseline justify-between gap-3 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate text-text" title={p.name}>
                        {p.name}
                      </span>
                      <span className="shrink-0 text-right whitespace-nowrap">
                        <span className="font-semibold text-ink">
                          {formatDistance(p.distanceMeters)}
                        </span>
                        <span className="ml-2 text-muted">{walkTime(p.distanceMeters)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                {g.places.length > SHOWN_PER_GROUP && (
                  <button
                    type="button"
                    onClick={() => toggle(setExpanded, g.key)}
                    className="mt-2 text-sm font-semibold text-primary hover:underline"
                  >
                    {open ? "Show less" : `Show all ${g.places.length}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-4 text-xs text-muted">
        Nearby places from{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          OpenStreetMap
        </a>
        . Walking times assume {NEARBY.WALK_METERS_PER_MINUTE} m per minute, in a straight line.
      </p>
    </section>
  );
}
