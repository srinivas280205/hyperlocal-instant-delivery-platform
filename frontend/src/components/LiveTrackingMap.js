import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const makeIcon = (emoji, bg) => L.divIcon({
  html: `<div style="background:${bg};border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${emoji}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: '',
});

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [40, 40] });
    }
  }, [positions, map]);
  return null;
}

export default function LiveTrackingMap({ pickup, dropoff, riderLocation }) {
  const positions = [
    pickup && [pickup.lat, pickup.lng],
    dropoff && [dropoff.lat, dropoff.lng],
  ].filter(Boolean);

  const center = pickup ? [pickup.lat, pickup.lng] : [13.0827, 80.2707];

  return (
    <MapContainer center={center} zoom={13} style={{ height: 300, borderRadius: 16 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBounds positions={positions} />
      {pickup && (
        <Marker position={[pickup.lat, pickup.lng]} icon={makeIcon('📦', '#3b82f6')}>
          <Popup>Pickup: {pickup.address}</Popup>
        </Marker>
      )}
      {dropoff && (
        <Marker position={[dropoff.lat, dropoff.lng]} icon={makeIcon('🏠', '#22c55e')}>
          <Popup>Dropoff: {dropoff.address}</Popup>
        </Marker>
      )}
      {riderLocation && (
        <Marker position={[riderLocation.lat, riderLocation.lng]} icon={makeIcon('🛵', '#f97316')}>
          <Popup>Your Rider</Popup>
        </Marker>
      )}
      {positions.length === 2 && (
        <Polyline positions={positions} color="#3b82f6" weight={3} dashArray="8,8" />
      )}
    </MapContainer>
  );
}
