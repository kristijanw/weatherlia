import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css';
import {
  fetchOwmAirPollution,
  getOwmAqiPresentation,
  type OwmAirPollutionResponse,
} from '../utils/owmAirPollution';

const OWM_KEY = '9de243494c0b295cca9337e1e96b00e2';

const TILE_LAYERS = [
  { id: 'precipitation_new', label: 'Oborine' },
  { id: 'clouds_new', label: 'Oblačnost' },
  { id: 'temp_new', label: 'Temperatura' },
  { id: 'wind_new', label: 'Vjetar' },
] as const;

type TileLayerId = (typeof TILE_LAYERS)[number]['id'];
type MapLayerId = TileLayerId | 'air_pollution';

const MAP_LAYERS: { id: MapLayerId; label: string }[] = [
  ...TILE_LAYERS.map((l) => ({ id: l.id, label: l.label })),
  { id: 'air_pollution', label: 'Kvaliteta zraka' },
];

interface WeatherMapCardProps {
  lat: number;
  lon: number;
}

export function WeatherMapCard({ lat, lon }: WeatherMapCardProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);
  const overlayRef = useRef<import('leaflet').TileLayer | null>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayerId>('precipitation_new');
  const [airPollution, setAirPollution] = useState<OwmAirPollutionResponse | null>(null);
  const [airError, setAirError] = useState<string | null>(null);

  useEffect(() => {
    let map: import('leaflet').Map;

    async function init() {
      const L = (await import('leaflet')).default;
      (window as unknown as { L: typeof L }).L = L;
      await import('leaflet-gesture-handling');

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if (!mapRef.current) return;

      map = L.map(mapRef.current, {
        zoomControl: true,
        gestureHandling: true,
        gestureHandlingOptions: {
          text: {
            touch: 'Pomičite kartu pomoću dva prsta',
            scroll: 'Upotrijebite Ctrl i kotačić miša da biste zumirali kartu',
            scrollMac: 'Upotrijebite ⌘ i kotačić da biste zumirali kartu',
          },
        },
      }).setView([lat, lon], 7);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '©OpenStreetMap, ©CartoDB',
        maxZoom: 19,
      }).addTo(map);

      if (activeLayer !== 'air_pollution') {
        const overlay = L.tileLayer(
          `https://tile.openweathermap.org/map/${activeLayer}/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
          { opacity: 0.6, maxZoom: 19 }
        );
        overlay.addTo(map);
        overlayRef.current = overlay;
      }

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
        overlayRef.current = null;
      }
      if (activeLayer === 'air_pollution') return;
      const overlay = L.tileLayer(
        `https://tile.openweathermap.org/map/${activeLayer}/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
        { opacity: 0.6, maxZoom: 19 }
      );
      overlay.addTo(map);
      overlayRef.current = overlay;
    }
    updateLayer();
  }, [activeLayer]);

  useEffect(() => {
    if (activeLayer !== 'air_pollution') {
      setAirPollution(null);
      setAirError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchOwmAirPollution(lat, lon, OWM_KEY);
        if (!cancelled) {
          setAirPollution(data);
          setAirError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setAirPollution(null);
          setAirError(e instanceof Error ? e.message : 'Greška');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeLayer, lat, lon]);

  const air = airPollution?.list[0];
  const aqiInfo = air ? getOwmAqiPresentation(air.main.aqi) : null;

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
        {MAP_LAYERS.map((layer) => (
          <button
            key={layer.id}
            type="button"
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

      <div className="relative rounded-xl overflow-hidden">
        <div ref={mapRef} className="rounded-xl overflow-hidden" style={{ height: 500 }} />

        {activeLayer === 'air_pollution' && (
          <div className="absolute bottom-0 left-0 right-0 p-3 pt-8 bg-gradient-to-t from-black/85 via-black/70 to-transparent pointer-events-none">
            <div className="pointer-events-auto rounded-xl bg-black/55 border border-white/15 backdrop-blur-md p-3 text-sm text-white">
              {airError && <p className="text-red-300">{airError}</p>}
              {!airError && !air && <p className="text-white/60">Učitavanje…</p>}
              {aqiInfo && air && (
                <>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-white/70">OpenWeather indeks (1–5)</span>
                    <span className={`font-bold ${aqiInfo.label === 'Nepoznato' ? 'text-white/50' : 'text-white'}`}>
                      {air.main.aqi} — {aqiInfo.label}
                    </span>
                  </div>
                  <div className="flex rounded overflow-hidden h-2 mb-2 border border-white/20">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 ${
                          step === air.main.aqi
                            ? aqiInfo.segmentClass + ' ring-2 ring-white/80 ring-inset z-10'
                            : getOwmAqiPresentation(step).segmentClass
                        } opacity-90`}
                        title={`${step}`}
                      />
                    ))}
                  </div>
                  {aqiInfo.detail && <p className="text-white/75 text-xs mb-3 leading-snug">{aqiInfo.detail}</p>}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <Pollutant label="PM2.5" value={air.components.pm2_5} unit="µg/m³" />
                    <Pollutant label="PM10" value={air.components.pm10} unit="µg/m³" />
                    <Pollutant label="O₃" value={air.components.o3} unit="µg/m³" />
                    <Pollutant label="NO₂" value={air.components.no2} unit="µg/m³" />
                    <Pollutant label="SO₂" value={air.components.so2} unit="µg/m³" />
                    <Pollutant label="CO" value={air.components.co} unit="µg/m³" />
                  </div>
                  <p className="text-white/45 text-[10px] mt-2 leading-tight">
                    Podaci za točku ({lat.toFixed(2)}, {lon.toFixed(2)}). Za US EPA ljestvicu (1–6) pogledajte karticu
                    iznad — WeatherAPI i OpenWeather koriste različite modele.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Pollutant({ label, value, unit }: { label: string; value: number; unit: string }) {
  const n = Number.isFinite(value) ? Math.round(value * 10) / 10 : value;
  return (
    <div className="bg-white/5 rounded-lg px-2 py-1.5">
      <div className="text-white/45 text-[10px]">{label}</div>
      <div className="font-medium tabular-nums">
        {n} <span className="text-white/40 text-[10px]">{unit}</span>
      </div>
    </div>
  );
}
