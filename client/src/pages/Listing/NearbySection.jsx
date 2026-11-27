// "Where it is" + "What's nearby" on the Listing page.
// Map with category markers (chips above it show/hide each category), then a list grouped by
// category with distance and walking time. Data: GET /api/listings/:id/nearby (OpenStreetMap).
// Pick a place (in the list, on a marker, or anywhere on the map) to see the real walking
// route drawn on the map: GET /api/listings/:id/route.
// <NearbySection listingId={7} lat={27.71} lng={85.32} district="Kathmandu" />
import { useEffect, useRef, useState } from "react";
import { NEARBY } from "@realestate/shared";
import Icon from "../../components/Icon.jsx";
import { Skeleton } from "../../components/Loader.jsx";
import { getNearbyPlaces, getWalkingRoute } from "../../services/listings.service.js";
import ListingMap from "./ListingMap.jsx";
import RouteCard from "./RouteCard.jsx";
import { CATEGORIES, formatDistance, walkTime } from "./nearbyCategories.js";

const SHOWN_PER_GROUP = 3; // the rest behind "Show all"
const NO_ROUTE = { status: "idle", target: null, data: null, error: "" };

export default function NearbySection({ listingId, lat, lng, district }) {
  // loadedId = which listing the data belongs to; different from listingId = loading
  const [loaded, setLoaded] = useState({ loadedId: null, items: [], message: null, error: "" });
  const [hidden, setHidden] = useState(() => new Set()); // categories switched off
  const [expanded, setExpanded] = useState(() => new Set()); // groups showing every place
  const [filter, setFilter] = useState(""); // the "find a place" box
  // Walking route: { status: "idle" | "loading" | "ready" | "error", target, data, error }
  const [route, setRoute] = useState(NO_ROUTE);
  const routeTicket = useRef(0); // only the newest route answer is shown
  const mapBox = useRef(null);
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

  // Ask for the walking route to a place (or a point picked on the map)
  function walkTo(target) {
    const ticket = ++routeTicket.current;
    setRoute({ status: "loading", target, data: null, error: "" });
    // On phones the list sits under the map: bring the map back into view
    const box = mapBox.current?.getBoundingClientRect();
    if (box && (box.top < 0 || box.bottom > window.innerHeight)) {
      mapBox.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    getWalkingRoute(listingId, { lat: target.lat, lng: target.lng })
      .then((data) => {
        if (ticket === routeTicket.current) setRoute({ status: "ready", target, data, error: "" });
      })
      .catch((err) => {
        if (ticket !== routeTicket.current) return;
        const error =
          err.status === 429
            ? "Too many route requests. Please wait a minute and try again."
            : err.message;
        setRoute({ status: "error", target, data: null, error });
      });
  }

  function clearRoute() {
    routeTicket.current += 1; // an answer still on its way is ignored
    setRoute(NO_ROUTE);
  }

  const { items, message, error } = loaded;
  const groups = CATEGORIES.map((c) => ({
    ...c,
    places: items.filter((p) => p.category === c.key),
  })).filter((g) => g.places.length > 0);
  const visiblePlaces = items.filter((p) => !hidden.has(p.category));
  const query = filter.trim().toLowerCase();
  const shownGroups = groups
    .map((g) => ({ ...g, places: g.places.filter((p) => p.name.toLowerCase().includes(query)) }))
    .filter((g) => g.places.length > 0);

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

      <div ref={mapBox} className="mt-4">
        <ListingMap
          lat={lat}
          lng={lng}
          places={loading ? [] : visiblePlaces}
          route={route.status === "ready" ? route.data : null}
          destination={route.status === "idle" ? null : route.target}
          onPlaceClick={walkTo}
          onMapClick={(point) =>
            walkTo({ id: "map-point", name: "the point you picked", ...point })
          }
          overlay={route.status !== "idle" && <RouteCard state={route} onClear={clearRoute} />}
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        Tap a place below or on the map (or any spot on the map) to see the walking route.
      </p>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <h3 className="display text-xl text-ink">What's nearby</h3>
        {!loading && groups.length > 0 && (
          <label className="relative w-full sm:w-64">
            <span className="sr-only">Find a place nearby</span>
            <Icon
              name="search"
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Find a place nearby"
              className="field py-2 pl-9 text-sm"
            />
          </label>
        )}
      </div>

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
        <p className="mt-3 flex items-start gap-2 text-small text-danger">
          <Icon name="alert" className="mt-0.5 h-4 w-4" /> Couldn't load nearby places: {error}
        </p>
      ) : groups.length === 0 ? (
        <div className="mt-3 flex items-start gap-3 text-muted">
          <Icon name="map" className="mt-0.5 h-5 w-5 text-accent-dark" />
          <div>
            <p className="font-semibold text-ink">No nearby data for this area yet</p>
            <p className="text-sm">
              {message ??
                "OpenStreetMap has no schools, shops or bus stops mapped close to here. You can still tap the map to see a walking route."}
            </p>
          </div>
        </div>
      ) : shownGroups.length === 0 ? (
        <p className="mt-4 text-small text-muted">
          No nearby place matches &ldquo;{filter.trim()}&rdquo;. Try another name, or tap the map.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {shownGroups.map((g) => {
            const open = expanded.has(g.key) || Boolean(query);
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
                  {shown.map((p) => {
                    const active = route.status !== "idle" && route.target?.id === p.id;
                    return (
                      <li key={p.id ?? `${p.lat}-${p.lng}`}>
                        <button
                          type="button"
                          onClick={() => walkTo(p)}
                          aria-pressed={active}
                          aria-label={`Show the walking route to ${p.name}, ${formatDistance(p.distanceMeters)} away`}
                          className={`-mx-2 flex w-[calc(100%+1rem)] items-baseline justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm transition ${
                            active ? "bg-primary-soft" : "hover:bg-sand/70"
                          }`}
                        >
                          <span
                            className={`min-w-0 truncate ${active ? "font-semibold text-primary" : "text-text"}`}
                            title={p.name}
                          >
                            {p.name}
                          </span>
                          <span className="shrink-0 text-right whitespace-nowrap">
                            <span className="font-semibold text-ink">
                              {formatDistance(p.distanceMeters)}
                            </span>
                            <span className="ml-2 text-muted">{walkTime(p.distanceMeters)}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {g.places.length > SHOWN_PER_GROUP && !query && (
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
        Places and routes from{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          OpenStreetMap
        </a>
        . List times are a straight-line guide at {NEARBY.WALK_METERS_PER_MINUTE} m per minute; tap
        a place for the real walking route.
      </p>
    </section>
  );
}
