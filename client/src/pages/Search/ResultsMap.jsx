// Map of the search results (Leaflet + OpenStreetMap). Owner: M3.
// One marker per listing that has lat/lng. The map zooms to fit the markers.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { formatPrice } from "../../utils/formatPrice.js";

// Vite renames image files, so tell Leaflet where its default marker pictures are.
// Without this the markers show as broken images.
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

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
      <MapContainer
        center={NEPAL_CENTRE}
        zoom={NEPAL_ZOOM}
        scrollWheelZoom={false}
        className="h-80 w-full lg:h-[calc(100vh-8rem)]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map((listing) => (
          <Marker key={listing.id} position={[listing.lat, listing.lng]}>
            <Popup>
              <p className="m-0 font-semibold">{listing.title}</p>
              <p className="m-0">{formatPrice(listing.price, listing.type)}</p>
              <Link to={buildRoute(ROUTES.LISTING, { id: listing.id })}>View listing</Link>
            </Popup>
          </Marker>
        ))}
        <FitToMarkers points={points} />
      </MapContainer>
    </div>
  );
}
