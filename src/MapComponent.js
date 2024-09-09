import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const customIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapComponent = ({ center }) => {
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (map) {
      map.setView(center, 13);
    }
  }, [map, center]);

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '400px', width: '100%', borderRadius: '10px', overflow: 'hidden' }}
      whenCreated={setMap}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={center} icon={customIcon}>
        <Popup>
          Coordinates: {center[0]}, {center[1]}
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapComponent;
