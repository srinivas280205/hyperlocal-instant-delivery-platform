import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const customIcon = (color) => L.divIcon({
  html: `<div style="background:${color};width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  className: '',
});

function LocationMarker({ onSelect }) {
  useMapEvents({
    click(e) { onSelect({ lat: e.latlng.lat, lng: e.latlng.lng }); },
  });
  return null;
}

export default function MapPicker({ value, onChange, color = '#ef4444', label }) {
  const [center] = useState([13.0827, 80.2707]); // Chennai default

  useEffect(() => {
    if (!value && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="map-picker">
      <p className="map-label">📍 {label} — tap map to set location</p>
      <MapContainer center={value ? [value.lat, value.lng] : center} zoom={13} style={{ height: 220, borderRadius: 12 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationMarker onSelect={onChange} />
        {value && <Marker position={[value.lat, value.lng]} icon={customIcon(color)} />}
      </MapContainer>
      {value && (
        <p className="map-coords">
          Lat: {value.lat.toFixed(5)}, Lng: {value.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
