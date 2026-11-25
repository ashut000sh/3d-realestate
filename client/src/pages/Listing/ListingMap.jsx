// Small map with one marker for the Listing page. Owner: M3.
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Vite renames image files, so tell Leaflet where its marker pictures are
// Leaflet guesses its image folder from the CSS and puts it in front of these URLs,
// which breaks Vite's file names (the marker shows as a broken image). Turn that off.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export default function ListingMap({ lat, lng }) {
  return (
    <div className="card overflow-hidden p-0">
      <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} className="h-56 w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </div>
  );
}
