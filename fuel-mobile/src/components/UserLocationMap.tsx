import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Geolocation } from '@capacitor/geolocation';

const UserLocationMap = ({ height = '400px' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const mapInstance = L.map(mapRef.current, {
      center: [50.449891, 30.52377],
      zoom: 15,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(mapInstance);

    setMap(mapInstance);

    return () => {
      mapInstance.remove(); // ✅ cleanup без помилок TS
    };
  }, []);

  useEffect(() => {
    if (!map) return;

    const getPosition = async () => {
      try {
        await Geolocation.requestPermissions();
        const position = await Geolocation.getCurrentPosition({
            timeout: 20000, // 20 секунд
            enableHighAccuracy: true, // точніше визначення
          });
        const { latitude, longitude } = position.coords;

        map.setView([latitude, longitude], 16);

        const userIcon = L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077012.png',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        L.marker([latitude, longitude], { icon: userIcon })
          .addTo(map)
          .bindPopup('Ти тут!')
          .openPopup();

        setErrorMessage(null);
      } catch (e: unknown) {
        console.error('Помилка геолокації:', e);
        if (e instanceof Error) {
          setErrorMessage(e.message);
        } else {
          setErrorMessage('Невідома помилка геолокації');
        }
      }
    };

    getPosition();
  }, [map]);

  return (
    <div style={{ position: 'relative', height }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }}></div>
      {errorMessage && (
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(255,0,0,0.8)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 'bold',
            zIndex: 1000,
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default UserLocationMap;