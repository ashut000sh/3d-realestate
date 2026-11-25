// Map of the search results (Leaflet + OpenStreetMap). Owner: M3.
// One marker per listing that has lat/lng. The map zooms to fit the markers.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "../../components/Icon.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { formatCompactPrice, formatPrice } from "../../utils/formatPrice.js";

// Price tag markers in the brand colours instead of Leaflet's default blue pins.
// Dark tags = the home has a 3D tour.
const priceIcon = (listing) => {
  const dark = listing.hasTour;
  const dot = dark ? '<span style="color:#c39a4b">&#9679;</span>' : "";
  return L.divIcon({
    className: "",
    iconSize: null,
    html:
      `<div style="transform:translate(-50%,-100%);display:inline-flex;align-items:center;gap:4px;` +
      `white-space:nowrap;padding:5px 10px;border-radius:999px;` +
      `background:${dark ? "#0e2a23" : "#fff"};color:${dark ? "#fff" : "#0e2a23"};` +
      `font:600 12px Inter,system-ui,sans-serif;box-shadow:0 6px 16px rgba(14,42,35,.25);` +
      `border:1px solid rgba(14,42,35,.12)">${dot}${formatCompactPrice(listing.price)}</div>`,
  });
};

// Centre of Nepal, used when there are no results to show
const NEPAL_CENTRE = [28.1, 84.1];
const NEPAL_ZOOM = 7;

// Moves the map so every marker is visible
function FitToMarkers({ points }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join(";");

  useEffect(() => {
    if (points.length === 0) {
      map.setView(NEPAL_CENTRE, NEPAL_ZOOM);
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(points, { padding: [30, 30], maxZoom: 15 });
    }
    // key changes only when the markers change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);

  return null;
}

export default function ResultsMap({ listings }) {
  const located = listings.filter(
    (listing) => typeof listing.lat === "number" && typeof listing.lng === "number",
  );
  const points = located.map((listing) => [listing.lat, listing.lng]);

  return (
    <div className="card overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm">
        <span className="flex items-center gap-2 font-semibold text-ink">
          <Icon name="map" className="h-4 w-4 text-accent-dark" /> Map view
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="h-2 w-2 rounded-full bg-ink" /> has 3D tour
        </span>
      </div>
      <MapContainer
        center={NEPAL_CENTRE}
        zoom={NEPAL_ZOOM}
        scrollWheelZoom={false}
        className="h-80 w-full xl:h-[calc(100vh-11rem)]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map((listing) => (
          <Marker key={listing.id} position={[listing.lat, listing.lng]} icon={priceIcon(listing)}>
            <Popup>
              <p className="m-0 font-semibold text-ink">{listing.title}</p>
              <p className="m-0 text-muted">{formatPrice(listing.price, listing.type)}</p>
              <Link to={buildRoute(ROUTES.LISTING, { id: listing.id })} className="font-semibold">
                View home →
              </Link>
            </Popup>
          </Marker>
        ))}
        <FitToMarkers points={points} />
      </MapContainer>
    </div>
  );
}
