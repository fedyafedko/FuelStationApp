// src/components/RobotRouteMap.tsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import polyline from '@mapbox/polyline';

type RobotRouteMapProps = {
  encodedPolyline: string;
  height?: string;
  speed?: number;
  onPositionChange?: (lat: number, lng: number, isFinished: boolean) => void;
};

export default function RobotRouteMap({
  encodedPolyline,
  height = '500px',
  speed = 0.01,
  onPositionChange,
}: RobotRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markerRef    = useRef<L.Marker | null>(null);
  const rafRef       = useRef<number | null>(null);
  const mountedRef   = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!containerRef.current || !encodedPolyline) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([50.449891, 30.52377], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const coords: [number, number][] = polyline.decode(encodedPolyline);

    // Styled route line
    L.polyline(coords, {
      color: '#fb923c',
      weight: 4,
      opacity: 0.8,
      dashArray: '8 4',
    }).addTo(map);

    // Destination marker
    L.divIcon({
      className: '',
      html: `<div style="
        width:14px;height:14px;border-radius:50%;
        background:#22c55e;border:3px solid white;
        box-shadow:0 2px 8px rgba(34,197,94,0.6);
      "></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const destIcon = L.divIcon({
      className: '',
      html: `<div style="
        width:16px;height:16px;border-radius:50%;
        background:#22c55e;border:3px solid white;
        box-shadow:0 2px 12px rgba(34,197,94,0.7);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker(coords[coords.length - 1], { icon: destIcon }).addTo(map);

    // Robot icon
    const robotIcon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(251,146,60,0.2);animation:robotPulse 1.5s ease-in-out infinite;"></div>
          <div style="position:relative;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#fb923c,#f43f5e);border:2.5px solid white;box-shadow:0 3px 12px rgba(251,146,60,0.6);display:flex;align-items:center;justify-content:center;font-size:14px;z-index:2;">🤖</div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const marker = L.marker(coords[0], { icon: robotIcon }).addTo(map);
    markerRef.current = marker;
    mapRef.current = map;

    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [40, 40] });

    setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 100);

    let segmentIndex = 0;
    let progress = 0;

    function animate() {
      if (!mountedRef.current || !markerRef.current) return;
      if (segmentIndex >= coords.length - 1) {
        // Reached end
        const [endLat, endLng] = coords[coords.length - 1];
        markerRef.current.setLatLng([endLat, endLng]);
        onPositionChange?.(endLat, endLng, true);
        return;
      }

      const [lat1, lng1] = coords[segmentIndex];
      const [lat2, lng2] = coords[segmentIndex + 1];

      const lat = lat1 + (lat2 - lat1) * progress;
      const lng = lng1 + (lng2 - lng1) * progress;

      markerRef.current.setLatLng([lat, lng]);
      onPositionChange?.(lat, lng, false);

      progress += speed;
      if (progress >= 1) {
        progress = 0;
        segmentIndex++;
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      mountedRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [encodedPolyline, speed]);

  return (
    <>
      <style>{`
        @keyframes robotPulse {
          0%,100% { transform:scale(1); opacity:0.7; }
          50%      { transform:scale(1.5); opacity:0; }
        }
        .leaflet-map-pane,.leaflet-tile-pane,.leaflet-overlay-pane,
        .leaflet-shadow-pane,.leaflet-marker-pane,.leaflet-tooltip-pane,
        .leaflet-popup-pane { z-index:auto !important; }
        .leaflet-top,.leaflet-bottom { z-index:1 !important; }
      `}</style>
      <div ref={containerRef} style={{ height, width: '100%' }} />
    </>
  );
}