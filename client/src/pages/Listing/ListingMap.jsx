// Small map with one marker for the Listing page. Owner: M3.
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

export default function ListingMap({ lat, lng }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] ring-1 ring-border">
      <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} className="h-72 w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={HOME_ICON} />
      </MapContainer>
    </div>
  );
}
