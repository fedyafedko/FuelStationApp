import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PickedLocation { latitude: number; longitude: number }

export function UserLocationMap({ value }: { value: PickedLocation }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markerRef    = useRef<L.Marker | null>(null);
  const mountedRef   = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [value.latitude, value.longitude],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((map as any).tap) (map as any).tap.disable();

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    });

    tileLayer.on('tileerror', () => {
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);
    });

    tileLayer.addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 100);

    const pulsingIcon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(251,146,60,0.15);animation:userPulse 2s ease-in-out infinite;"></div>
          <div style="position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(251,146,60,0.25);animation:userPulse 2s ease-in-out infinite 0.3s;"></div>
          <div style="position:relative;width:14px;height:14px;border-radius:50%;background:linear-gradient(135deg,#fb923c,#f43f5e);border:2.5px solid white;box-shadow:0 2px 12px rgba(251,146,60,0.6);z-index:2;"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });

    const makePopup = (lat: number, lng: number) => `
      <div style="font-family:'Sora',sans-serif;padding:4px 2px;min-width:120px;">
        <div style="font-weight:700;font-size:13px;color:#111;">You are here</div>
        <div style="font-size:11px;color:#888;margin-top:3px;font-family:monospace;">
          ${lat.toFixed(5)}, ${lng.toFixed(5)}
        </div>
      </div>
    `;

    const marker = L.marker([value.latitude, value.longitude], { icon: pulsingIcon })
      .addTo(map)
      .bindPopup(makePopup(value.latitude, value.longitude))
      .openPopup();

    mapRef.current    = map;
    markerRef.current = marker;

    return () => {
      mountedRef.current = false;
      mapRef.current = null;
      markerRef.current = null;
      map.remove();
    };
  }, []);

  // When value prop changes (parent got real GPS coords), update the map view and marker
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    mapRef.current.setView([value.latitude, value.longitude], 16);
    markerRef.current.setLatLng([value.latitude, value.longitude]);
    setTimeout(() => mapRef.current?.invalidateSize(), 100);
  }, [value.latitude, value.longitude]);

  return (
    <>
      <style>{`
        @keyframes userPulse {
          0%,100% { transform: scale(1);   opacity: 0.7; }
          50%      { transform: scale(1.5); opacity: 0;   }
        }
        .leaflet-map-pane,
        .leaflet-tile-pane,
        .leaflet-overlay-pane,
        .leaflet-shadow-pane,
        .leaflet-marker-pane,
        .leaflet-tooltip-pane,
        .leaflet-popup-pane { z-index: auto !important; }
        .leaflet-top,
        .leaflet-bottom { z-index: 1 !important; }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important;
          border: 1px solid rgba(0,0,0,0.06) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content { margin: 10px 14px !important; }
        .leaflet-popup-tip { display: none !important; }
      `}</style>

      <div style={{
        position: 'absolute',
        inset: 0,
        isolation: 'isolate',
        zIndex: 0,
      }}>
        <div
          ref={containerRef}
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </>
  );
}