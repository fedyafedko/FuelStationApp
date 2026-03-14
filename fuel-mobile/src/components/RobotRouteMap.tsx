// src/components/RobotRouteMap.tsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import polyline from '@mapbox/polyline';

type RobotRouteMapProps = {
  encodedPolyline: string; // polyline маршруту
  height?: string;
  speed?: number; // швидкість анімації
};

export default function RobotRouteMap({ encodedPolyline, height = '500px', speed = 0.01 }: RobotRouteMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!encodedPolyline) return;

    // 1️⃣ Створюємо карту
    mapRef.current = L.map('robot-map').setView([50.449891, 30.52377], 15);

    // 2️⃣ Підключаємо тайли OSM
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(mapRef.current);

    // 3️⃣ Декодуємо polyline
    const coords: [number, number][] = polyline.decode(encodedPolyline);

    // 4️⃣ Малюємо маршрут
    const routeLine = L.polyline(coords, { color: 'blue', weight: 5 }).addTo(mapRef.current);
    mapRef.current.fitBounds(routeLine.getBounds());

    // 5️⃣ Іконка робота
    const robotIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    // 6️⃣ Створюємо маркер
    markerRef.current = L.marker(coords[0], { icon: robotIcon }).addTo(mapRef.current);

    // 7️⃣ Анімація
    let segmentIndex = 0;
    let progress = 0;

    function animate() {
      if (!markerRef.current) return;
      if (segmentIndex >= coords.length - 1) return;

      const [lat1, lng1] = coords[segmentIndex];
      const [lat2, lng2] = coords[segmentIndex + 1];

      const lat = lat1 + (lat2 - lat1) * progress;
      const lng = lng1 + (lng2 - lng1) * progress;

      markerRef.current.setLatLng([lat, lng]);

      progress += speed;
      if (progress >= 1) {
        progress = 0;
        segmentIndex++;
      }

      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      mapRef.current?.remove();
    };
  }, [encodedPolyline, speed]);

  return <div id="robot-map" style={{ height, width: '100%' }} />;
}