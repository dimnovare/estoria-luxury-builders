import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Vite doesn't resolve Leaflet's default marker icon URLs (they assume a CSS
// relative path that the bundler rewrites away), so wire the imported assets
// in explicitly — otherwise the marker renders as a broken image.
const markerIconInstance = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface PropertyMapProps {
  lat: number;
  lng: number;
  address?: string;
  className?: string;
}

/**
 * Free, key-less property location map. OpenStreetMap tiles via Leaflet — no
 * API key, no billing, no usage caps for this volume. Tiles load as <img> from
 * *.tile.openstreetmap.org, already permitted by the site CSP (img-src https:).
 */
export default function PropertyMap({ lat, lng, address, className }: PropertyMapProps) {
  const { t } = useTranslation();
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      className={className}
      style={{ height: '100%', width: '100%' }}
      aria-label={t('propertyMap.ariaLabel', 'Map showing the property location')}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={markerIconInstance}>
        {address && <Popup>{address}</Popup>}
      </Marker>
    </MapContainer>
  );
}
