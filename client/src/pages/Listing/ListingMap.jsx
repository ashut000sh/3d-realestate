// Map for the Listing page. Owner: M3.
// <ListingMap lat lng />                    the home only
// <ListingMap lat lng places={[...]} />     plus small category markers for nearby places
//                                           and a faint ring showing the search radius
// Walking routes (optional):
//   route={{ coordinates: [[lat, lng], ...] }}  draws the route, animated along the path
//   destination={{ lat, lng }}                   a pin at the end
//   onPlaceClick(place) / onMapClick({ lat, lng }) pick where to walk to
//   overlay={<RouteCard ... />}                  shown over the top-right corner of the map
import { useEffect } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { NEARBY } from "@realestate/shared";
import { ICON_PATHS } from "../../components/Icon.jsx";
import { CATEGORY_BY_KEY, formatDistance, walkTime } from "./nearbyCategories.js";

const GREEN = "#1d5b4c";
const GOLD = "#c39a4b";
const DRAW_MS = 800;

// Brand-coloured pin (a house in a dark circle) instead of Leaflet's default blue marker
const HOME_ICON = L.divIcon({
  className: "",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  html:
    '<div style="width:44px;height:44px;border-radius:999px;background:#0e2a23;display:flex;' +
    'align-items:center;justify-content:center;box-shadow:0 0 0 8px rgba(195,154,75,.25),0 8px 20px rgba(14,42,35,.35)">' +
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c39a4b" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z"/></svg></div>',
});

// Route start: a gold dot with a soft pulse (the pulse stops with "reduce motion", see index.css)
const START_ICON = L.divIcon({
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html: `<span class="route-start-dot" style="--dot:${GOLD}"></span>`,
});

// Route end: a green pin
const END_ICON = L.divIcon({
  className: "",
  iconSize: [30, 38],
  iconAnchor: [15, 36],
  html:
    '<svg width="30" height="38" viewBox="0 0 30 38"><path d="M15 37s12-11.3 12-21A12 12 0 0 0 3 16c0 9.7 12 21 12 21Z" ' +
    `fill="${GREEN}" stroke="#fff" stroke-width="2"/><circle cx="15" cy="16" r="4.5" fill="#fff"/></svg>`,
});

// One small round icon per category, made once
const placeIcons = {};
function placeIcon(category) {
  if (!placeIcons[category]) {
    const meta = CATEGORY_BY_KEY[category];
    placeIcons[category] = L.divIcon({
      className: "",
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      html:
        `<div style="width:26px;height:26px;border-radius:999px;background:${meta?.color ?? "#6c7470"};` +
        "border:2px solid #fff;display:flex;align-items:center;justify-content:center;" +
        'box-shadow:0 3px 8px rgba(14,42,35,.3)"><svg width="14" height="14" viewBox="0 0 24 24" ' +
        'fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
        `<path d="${ICON_PATHS[meta?.icon] ?? ICON_PATHS.pin}"/></svg></div>`,
    });
  }
  return placeIcons[category];
}

// Zooms so the whole search radius fits
function FitRadius({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(L.latLng(lat, lng).toBounds(NEARBY.RADIUS_METERS * 2), { padding: [8, 8] });
  }, [map, lat, lng]);
  return null;
}

// Clicks on empty map = "walk to this point"
function MapClicks({ onMapClick }) {
  useMapEvents({ click: (event) => onMapClick({ lat: event.latlng.lat, lng: event.latlng.lng }) });
  return null;
}

// The walking route: fit it in view, then draw it along the path (stroke-dashoffset).
// Plain Leaflet (not <Polyline>) so we can reach the SVG path and time the animation.
function RouteLine({ coordinates }) {
  const map = useMap();

  useEffect(() => {
    if (!coordinates?.length) return undefined;
    const line = L.polyline(coordinates, {
      color: GREEN,
      weight: 6,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
      interactive: false,
    });
    // Fit first, without a zoom animation: a zoom redraws the path and would break the dashes.
    // Leave room for the route card over the top of the map (it is full width on phones).
    const narrow = map.getSize().x < 560;
    map.fitBounds(line.getBounds(), {
      paddingTopLeft: narrow ? [28, 140] : [48, 48],
      paddingBottomRight: narrow ? [28, 36] : [300, 48],
      maxZoom: 17,
      animate: false,
    });
    line.addTo(map);

    const path = line.getElement();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer = 0;
    if (path && !still && typeof path.getTotalLength === "function") {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      path.getBoundingClientRect(); // apply the start state before animating
      path.style.transition = `stroke-dashoffset ${DRAW_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`;
      path.style.strokeDashoffset = "0";
      // Afterwards drop the dashes, so zooming (which changes the path length) can't cut the line
      timer = window.setTimeout(() => {
        path.style.transition = "";
        path.style.strokeDasharray = "";
        path.style.strokeDashoffset = "";
      }, DRAW_MS + 50);
    }

    return () => {
      window.clearTimeout(timer);
      line.remove();
    };
  }, [map, coordinates]);

  return null;
}

export default function ListingMap({
  lat,
  lng,
  places,
  route,
  destination,
  onPlaceClick,
  onMapClick,
  overlay,
}) {
  const showNearby = Array.isArray(places);
  const start = route?.coordinates?.[0];
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] ring-1 ring-border">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        className={`w-full ${showNearby ? "h-[26rem]" : "h-72"} ${onMapClick ? "cursor-crosshair" : ""}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showNearby && (
          <>
            <Circle
              center={[lat, lng]}
              radius={NEARBY.RADIUS_METERS}
              pathOptions={{ color: GREEN, weight: 1, opacity: 0.4, fillOpacity: 0.04 }}
            />
            <FitRadius lat={lat} lng={lng} />
            {places.map((p) => (
              <Marker
                key={p.id ?? `${p.category}-${p.lat}-${p.lng}`}
                position={[p.lat, p.lng]}
                icon={placeIcon(p.category)}
                // While a route is shown, other places fade so the green line stays readable
                opacity={route ? 0.35 : 1}
                eventHandlers={onPlaceClick ? { click: () => onPlaceClick(p) } : undefined}
              >
                {!onPlaceClick && (
                  <Popup>
                    <p className="m-0 font-semibold text-ink">{p.name}</p>
                    <p className="m-0 text-muted">
                      {CATEGORY_BY_KEY[p.category]?.one} · {formatDistance(p.distanceMeters)} ·{" "}
                      {walkTime(p.distanceMeters)}
                    </p>
                  </Popup>
                )}
              </Marker>
            ))}
          </>
        )}
        {onMapClick && <MapClicks onMapClick={onMapClick} />}
        {route?.coordinates?.length > 0 && <RouteLine coordinates={route.coordinates} />}
        {start && (
          <Marker position={start} icon={START_ICON} interactive={false} zIndexOffset={900} />
        )}
        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={END_ICON}
            interactive={false}
            zIndexOffset={1100}
          />
        )}
        <Marker position={[lat, lng]} icon={HOME_ICON} zIndexOffset={1000} />
      </MapContainer>
      {/* Above Leaflet's panes (400-700) and controls (800+), away from the attribution */}
      {overlay && (
        <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex justify-end">
          <div className="pointer-events-auto w-full max-w-[17rem]">{overlay}</div>
        </div>
      )}
    </div>
  );
}
