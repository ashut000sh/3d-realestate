// Map of the search results (Leaflet + OpenStreetMap). Owner: M3.
// One price tag per listing that has lat/lng; the map zooms to fit them.
// <ResultsMap listings hoveredId onHover={(id | null) => ...} />
// The hovered home's tag turns green and lifts; hovering a tag highlights its card.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { formatCompactPrice, formatPrice } from "../../utils/formatPrice.js";

// Price tags in the brand colours. A gold dot = the home has a 3D tour.
// `active` (hovered) = green and lifted 4px, above the others.
const priceIcon = (listing, active) => {
  const dot = listing.hasTour
    ? `<span style="width:6px;height:6px;border-radius:999px;background:#c39a4b"></span>`
    : "";
  return L.divIcon({
    className: "",
    iconSize: null,
    html:
      `<div style="transform:translate(-50%,-100%) translateY(${active ? -4 : 0}px) scale(${active ? 1.08 : 1});` +
      `transition:transform .2s cubic-bezier(.22,1,.36,1),background .2s,color .2s;` +
      `display:inline-flex;align-items:center;gap:6px;white-space:nowrap;padding:6px 10px;border-radius:999px;` +
      `background:${active ? "#1d5b4c" : "#fff"};color:${active ? "#fff" : "#16201d"};` +
      `font:600 12px Inter,system-ui,sans-serif;font-variant-numeric:tabular-nums;` +
      `box-shadow:0 1px 2px rgba(14,42,35,.08),0 6px 16px -6px rgba(14,42,35,.35);` +
      `border:1px solid ${active ? "#1d5b4c" : "#e8e3d8"}">${dot}${formatCompactPrice(listing.price)}</div>`,
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
      map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
    }
    // key changes only when the markers change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);

  return null;
}

export default function ResultsMap({ listings, hoveredId = null, onHover, className = "" }) {
  const located = listings.filter(
    (listing) => typeof listing.lat === "number" && typeof listing.lng === "number",
  );
  const points = located.map((listing) => [listing.lat, listing.lng]);

  return (
    <div className={`overflow-hidden rounded-xl bg-sand ${className}`}>
      <MapContainer
        center={NEPAL_CENTRE}
        zoom={NEPAL_ZOOM}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map((listing) => {
          const active = listing.id === hoveredId;
          return (
            <Marker
              key={listing.id}
              position={[listing.lat, listing.lng]}
              icon={priceIcon(listing, active)}
              zIndexOffset={active ? 1000 : 0}
              eventHandlers={
                onHover && {
                  mouseover: () => onHover(listing.id),
                  mouseout: () => onHover(null),
                }
              }
            >
              <Popup>
                <p className="m-0 font-semibold text-ink">{listing.title}</p>
                <p className="m-0 text-muted">{formatPrice(listing.price, listing.type)}</p>
                <Link to={buildRoute(ROUTES.LISTING, { id: listing.id })} className="font-semibold">
                  View home →
                </Link>
              </Popup>
            </Marker>
          );
        })}
        <FitToMarkers points={points} />
      </MapContainer>
    </div>
  );
}
