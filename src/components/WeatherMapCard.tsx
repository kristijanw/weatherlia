import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const OWM_KEY = '9de243494c0b295cca9337e1e96b00e2';

const LAYERS = [
  { id: 'precipitation_new', label: 'Oborine' },
  { id: 'clouds_new', label: 'Oblačnost' },
  { id: 'temp_new', label: 'Temperatura' },
  { id: 'wind_new', label: 'Vjetar' },
] as const;

type LayerId = (typeof LAYERS)[number]['id'];

interface WeatherMapCardProps {
  lat: number;
  lon: number;
}

export function WeatherMapCard({ lat, lon }: WeatherMapCardProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);
  const overlayRef = useRef<import('leaflet').TileLayer | null>(null);
  const [activeLayer, setActiveLayer] = useState<LayerId>('precipitation_new');

  useEffect(() => {
    let map: import('leaflet').Map;

    async function init() {
      const L = (await import('leaflet')).default;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if (!mapRef.current) return;

      map = L.map(mapRef.current, { zoomControl: true }).setView([lat, lon], 7);
      mapInstanceRef.current = map;

      // Dark base tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '©OpenStreetMap, ©CartoDB',
        maxZoom: 19,
      }).addTo(map);

      // Overlay
      const overlay = L.tileLayer(
        `https://tile.openweathermap.org/map/${activeLayer}/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
        { opacity: 0.6, maxZoom: 19 }
      );
      overlay.addTo(map);
      overlayRef.current = overlay;

      // Custom marker
      const icon = L.divIcon({
        html: `<div style="width:28px;height:36px;display:flex;align-items:center;justify-content:center">
          <svg viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:28px;height:36px">
            <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 17 9 17s9-10.25 9-17c0-4.97-4.03-9-9-9z" fill="#1989FF"/>
            <circle cx="12" cy="9" r="4" fill="white"/>
          </svg>
        </div>`,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        className: '',
      });
      L.marker([lat, lon], { icon }).addTo(map);
    }

    init();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);

  useEffect(() => {
    async function updateLayer() {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;
      if (!map) return;
      if (overlayRef.current) {
        map.removeLayer(overlayRef.current);
      }
      const overlay = L.tileLayer(
        `https://tile.openweathermap.org/map/${activeLayer}/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
        { opacity: 0.6, maxZoom: 19 }
      );
      overlay.addTo(map);
      overlayRef.current = overlay;
    }
    updateLayer();
  }, [activeLayer]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={16} className="text-white/60" />
        <h3 className="text-white font-semibold">Radar karta</h3>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              activeLayer === layer.id
                ? 'bg-primary text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {layer.label}
          </button>
        ))}
      </div>

      <div
        ref={mapRef}
        className="rounded-xl overflow-hidden"
        style={{ height: 500 }}
      />
    </motion.div>
  );
}
