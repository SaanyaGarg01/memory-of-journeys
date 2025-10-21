import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type LatLngExpression } from 'leaflet';
import { JourneyLeg } from '../lib/supabase';

L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

type Props = {
  journeyLegs: JourneyLeg[];
  className?: string;
};

type CityCoord = {
  name: string;
  lat: number;
  lon: number;
};

export default function InteractiveCityMap({ journeyLegs, className = '' }: Props) {
  // Build ordered route: first origin, then each destination in leg order
  const routeStops = useMemo(() => {
    const stops: { city: string; country: string }[] = [];
    if (journeyLegs.length > 0) {
      const first = journeyLegs[0];
      stops.push({ city: first.fromCity, country: first.fromCountry });
      for (const leg of journeyLegs) {
        stops.push({ city: leg.toCity, country: leg.toCountry });
      }
    }
    return stops;
  }, [journeyLegs]);

  const [coords, setCoords] = useState<CityCoord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const results: CityCoord[] = [];
        for (const d of routeStops) {
          const cacheKey = `geo:${d.city},${d.country}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const val = JSON.parse(cached) as CityCoord;
            results.push(val);
            continue;
          }
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            `${d.city}, ${d.country}`
          )}&limit=1`;
          const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
          const data = await res.json();
          if (Array.isArray(data) && data[0]) {
            const c: CityCoord = { name: `${d.city}, ${d.country}`, lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
            results.push(c);
            localStorage.setItem(cacheKey, JSON.stringify(c));
          }
          await new Promise(r => setTimeout(r, 300));
        }
        if (mounted) setCoords(results);
      } catch {
        if (mounted) setCoords([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [routeStops]);

  const center = useMemo<[number, number]>(() => {
    if (coords.length > 0) return [coords[0].lat, coords[0].lon];
    return [20, 0];
  }, [coords]);

  const positions = useMemo<[number, number][]>(() => coords.map(c => [c.lat, c.lon]), [coords]);

  function FitBounds({ pts }: { pts: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
      if (pts.length >= 2) {
        map.fitBounds(pts as L.LatLngExpression[], { padding: [30, 30] });
      }
    }, [map, pts]);
    return null;
  }

  return (
    <div className={`rounded-2xl overflow-hidden border ${className} border-slate-700`}>
      <div className="h-80 relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/60 text-white text-sm">
            Loading map...
          </div>
        )}
        <MapContainer center={center as LatLngExpression} zoom={coords.length > 0 ? 3 : 2} className="h-full w-full" scrollWheelZoom>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {positions.length >= 2 && (
            <>
              <Polyline positions={positions as LatLngExpression[]} pathOptions={{ color: '#3b82f6', weight: 4 }} />
              <FitBounds pts={positions} />
            </>
          )}
          {coords.map((c, i) => (
            <Marker key={`${c.name}-${i}`} position={[c.lat, c.lon] as LatLngExpression}>
              <Popup>
                {c.name}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
