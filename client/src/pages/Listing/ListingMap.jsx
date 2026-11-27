// Map for the Listing page. Owner: M3.
// <ListingMap lat lng />                    the home only
// <ListingMap lat lng places={[...]} />     plus small category markers for nearby places
//                                           and a faint ring showing the search radius
import { useEffect } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { NEARBY } from "@realestate/shared";
import { ICON_PATHS } from "../../components/Icon.jsx";
import { CATEGORY_BY_KEY, formatDistance, walkTime } from "./nearbyCategories.js";

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

export default function ListingMap({ lat, lng, places }) {
  const showNearby = Array.isArray(places);
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] ring-1 ring-border">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        className={`w-full ${showNearby ? "h-80 sm:h-96" : "h-72"}`}
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
              pathOptions={{ color: "#1d5b4c", weight: 1, opacity: 0.4, fillOpacity: 0.04 }}
            />
            <FitRadius lat={lat} lng={lng} />
            {places.map((p) => (
              <Marker
                key={`${p.category}-${p.lat}-${p.lng}`}
                position={[p.lat, p.lng]}
                icon={placeIcon(p.category)}
              >
                <Popup>
                  <p className="m-0 font-semibold text-ink">{p.name}</p>
                  <p className="m-0 text-muted">
                    {CATEGORY_BY_KEY[p.category]?.one} · {formatDistance(p.distanceMeters)} ·{" "}
                    {walkTime(p.distanceMeters)}
                  </p>
                </Popup>
              </Marker>
            ))}
          </>
        )}
        <Marker position={[lat, lng]} icon={HOME_ICON} zIndexOffset={1000} />
      </MapContainer>
    </div>
  );
}
