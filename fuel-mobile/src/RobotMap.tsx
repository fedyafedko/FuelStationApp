// src/components/RobotMap.tsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import polyline from '@mapbox/polyline';
import 'leaflet/dist/leaflet.css';

const RobotMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // 1️⃣ Створюємо карту
    const map = L.map(mapRef.current).setView([50.449891, 30.52377], 15);

    // 2️⃣ Підключаємо тайли OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // 3️⃣ Polyline від OSRM
    const encodedPolyline = "uu|rH_}gyD?q@?K?gA?uB?gA?U?K?E@E@E@CDCDCFAF?FBFBDFDFTj@DHv@jBLPLRPTX^NNLHLHDBh@Z\\THJFJJRNZJH@B@@@?DBLBLDNDLDNDv@TB@TF?G@KL{A?CJaA?GBWJeANmB?ALeBDc@JB`B^`@JhAV`E~@|Cr@TFnBd@jAXt@PF@|A\\xA^RFDP?J@Lc@|EY`DUdCCTAREZ]fEObBIdAE\\ATEb@c@tEOhBO~ACNEb@Gp@WvCQlBk@pGGj@?Hi@tFKrACRe@fFGt@]zDUbCATQfB]vD{@pJE^o@~GI|@WvCMrAI~@o@|GOfBS|B]vCKz@o@jHOvAWrCKpAAD?DeApLADCTe@hFo@hHe@dFKbAWtCGr@ANSnBKfAMjACl@Wl@IJG@IAOEKKGSSo@EY?[DYHUFGHCPCb@JTHPFfA\\VHXHjAZb@LTf@F`@@`@?r@I|AKzA?j@Ad@AFC\\Gv@M`BGr@GjAMzBGxAGpBChAAdCFlFPhEz@fJDv@FzAHdA`BlNLnAP~ATtBh@vE~@xHRfBL`BHfC?fBAnACnAIpASrD]fGWpDo@vISjDWpEAp@?r@M?E?C?K@]?cCDM?I?K@@L@vBM?";

    // 4️⃣ Декодуємо polyline у [lat, lng]
    const coords = polyline.decode(encodedPolyline);

    // 5️⃣ Малюємо маршрут
    const routeLine = L.polyline(coords, { color: 'blue', weight: 5 }).addTo(map);
    map.fitBounds(routeLine.getBounds());

    // 6️⃣ Іконка робота
    const robotIcon = L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/4712/4712109.png",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    // 7️⃣ Створюємо маркер
    const robotMarker = L.marker(coords[0], { icon: robotIcon }).addTo(map);

    // 8️⃣ Плавна анімація
    let segmentIndex = 0;
    let progress = 0;
    const speed = 0.01;

    const animate = () => {
      if (segmentIndex >= coords.length - 1) return;

      const p1 = coords[segmentIndex];
      const p2 = coords[segmentIndex + 1];

      const lat = p1[0] + (p2[0] - p1[0]) * progress;
      const lng = p1[1] + (p2[1] - p1[1]) * progress;

      robotMarker.setLatLng([lat, lng]);

      progress += speed;
      if (progress >= 1) {
        progress = 0;
        segmentIndex++;
      }

      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      map.remove();
    };
  }, []);

  return <div ref={mapRef} style={{ height: '500px', width: '100%', marginTop: '10px' }}></div>;
};

export default RobotMap;