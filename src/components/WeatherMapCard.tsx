import { useEffect, useRef, useState } from 'react';
import { MapPin, Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css';
import {
  fetchOwmAirPollution,
  getOwmAqiPresentation,
  type OwmAirPollutionResponse,
} from '../utils/owmAirPollution';

const OWM_KEY = '9de243494c0b295cca9337e1e96b00e2';
const AQICN_KEY = import.meta.env.VITE_AQICN_TOKEN ?? '';
const RAINVIEWER_API = 'https://api.rainviewer.com/public/weather-maps.json';

const TILE_LAYERS = [
  { id: 'clouds_new', label: 'Clouds' },
  { id: 'temp_new', label: 'Temperature' },
  { id: 'wind_new', label: 'Wind' },
] as const;

type TileLayerId = (typeof TILE_LAYERS)[number]['id'];
type MapLayerId = TileLayerId | 'radar' | 'air_pollution';

const MAP_LAYERS: { id: MapLayerId; label: string }[] = [
  { id: 'radar', label: 'Precipitation' },
  ...TILE_LAYERS.map((l) => ({ id: l.id, label: l.label })),
  { id: 'air_pollution', label: 'Air Quality' },
];

// Approximate colors for RainViewer color scheme 4 (TWC), light→heavy
const RADAR_LEGEND = ['#00d4ff', '#0090e8', '#0058c8', '#00c000', '#50d000', '#e6e600', '#e89600', '#e83200', '#c00000', '#8b0000'];

interface RainViewerFrame {
  time: number;
  path: string;
}

interface WeatherMapCardProps {
  lat: number;
  lon: number;
}

export function WeatherMapCard({ lat, lon }: WeatherMapCardProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);
  const overlayRef = useRef<import('leaflet').TileLayer | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mapVersion, setMapVersion] = useState(0);
  const [activeLayer, setActiveLayer] = useState<MapLayerId>('radar');
  const [airPollution, setAirPollution] = useState<OwmAirPollutionResponse | null>(null);
  const [airError, setAirError] = useState<string | null>(null);

  const [radarFrames, setRadarFrames] = useState<RainViewerFrame[]>([]);
  const [radarHost, setRadarHost] = useState('https://tilecache.rainviewer.com');
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Map init — re-runs only when location changes
  useEffect(() => {
    async function init() {
      const L = (await import('leaflet')).default;
      (window as unknown as { L: typeof L }).L = L;
      await import('leaflet-gesture-handling');

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
        gestureHandling: true,
        gestureHandlingOptions: {
          text: {
            touch: 'Use two fingers to move the map',
            scroll: 'Use Ctrl + scroll to zoom the map',
            scrollMac: 'Use ⌘ + scroll to zoom the map',
          },
        },
      }).setView([lat, lon], 7);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '©OpenStreetMap, ©CartoDB',
        maxZoom: 19,
      }).addTo(map);

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

      setMapVersion((v) => v + 1);
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

  // Fetch RainViewer frames when on radar layer
  useEffect(() => {
    if (activeLayer !== 'radar') return;
    let cancelled = false;
    fetch(RAINVIEWER_API)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const past: RainViewerFrame[] = data.radar?.past ?? [];
        const nowcast: RainViewerFrame[] = data.radar?.nowcast ?? [];
        const frames = [...past, ...nowcast];
        setRadarHost(data.host ?? 'https://tilecache.rainviewer.com');
        setRadarFrames(frames);
        setFrameIndex(past.length > 0 ? past.length - 1 : 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeLayer]);

  // Radar tile update — runs when frame changes or map re-inits
  useEffect(() => {
    if (activeLayer !== 'radar' || !radarFrames.length) return;
    async function update() {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;
      if (!map) return;
      if (overlayRef.current) {
        map.removeLayer(overlayRef.current);
        overlayRef.current = null;
      }
      const frame = radarFrames[frameIndex];
      if (!frame) return;
      // color scheme 4 (TWC), smooth=1, snow=1
      const tile = L.tileLayer(
        `${radarHost}${frame.path}/512/{z}/{x}/{y}/4/1_1.png`,
        { opacity: 0.75, maxZoom: 19, attribution: '© <a href="https://rainviewer.com">RainViewer</a>' }
      );
      tile.addTo(map);
      overlayRef.current = tile;
    }
    update();
  }, [activeLayer, radarFrames, radarHost, frameIndex, mapVersion]);

  // Non-radar overlay update
  useEffect(() => {
    if (activeLayer === 'radar') return;
    async function update() {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;
      if (!map) return;
      if (overlayRef.current) {
        map.removeLayer(overlayRef.current);
        overlayRef.current = null;
      }
      if (activeLayer === 'air_pollution') {
        if (!AQICN_KEY) return;
        const tile = L.tileLayer(
          `https://tiles.waqi.info/tiles/usepa-aqi/{z}/{x}/{y}.png?token=${AQICN_KEY}`,
          { opacity: 0.7, maxZoom: 19, attribution: '© <a href="https://waqi.info">WAQI</a>' }
        );
        tile.addTo(map);
        overlayRef.current = tile;
        return;
      }
      const tile = L.tileLayer(
        `https://tile.openweathermap.org/map/${activeLayer}/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
        { opacity: 0.6, maxZoom: 19 }
      );
      tile.addTo(map);
      overlayRef.current = tile;
    }
    update();
  }, [activeLayer, mapVersion]);

  // Animation loop
  useEffect(() => {
    if (animTimerRef.current) {
      clearInterval(animTimerRef.current);
      animTimerRef.current = null;
    }
    if (!isPlaying || !radarFrames.length) return;
    animTimerRef.current = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % radarFrames.length);
    }, 600);
    return () => {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
    };
  }, [isPlaying, radarFrames.length]);

  useEffect(() => {
    if (activeLayer !== 'radar') setIsPlaying(false);
  }, [activeLayer]);

  // Air pollution data
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
          setAirError(e instanceof Error ? e.message : 'Error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeLayer, lat, lon]);

  const air = airPollution?.list[0];
  const aqiInfo = air ? getOwmAqiPresentation(air.main.aqi) : null;
  const currentFrame = radarFrames[frameIndex];
  const frameTime = currentFrame ? new Date(currentFrame.time * 1000) : null;
  const isNowcast = currentFrame ? currentFrame.time > Math.floor(Date.now() / 1000) : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={16} className="text-white/60" />
        <h3 className="text-white font-semibold">Radar Map</h3>
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
        <div ref={mapRef} className="rounded-xl overflow-hidden" style={{ height: 620 }} />

        {/* Precipitation (RainViewer) panel */}
        {activeLayer === 'radar' && radarFrames.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-[800] p-3 pt-12 bg-gradient-to-t from-black/85 via-black/60 to-transparent pointer-events-none">
            <div className="pointer-events-auto rounded-xl bg-black/60 border border-white/15 backdrop-blur-md p-3 space-y-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className="w-8 h-8 flex-shrink-0 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                >
                  {isPlaying
                    ? <Pause size={13} className="text-white" />
                    : <Play size={13} className="text-white ml-0.5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={radarFrames.length - 1}
                  value={frameIndex}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setFrameIndex(Number(e.target.value));
                  }}
                  className="flex-1 accent-blue-400 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 min-w-[90px] justify-end">
                  {isNowcast && (
                    <span className="text-[10px] text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded-full leading-none">
                      forecast
                    </span>
                  )}
                  <span className="text-white/80 text-xs tabular-nums font-medium">
                    {frameTime?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) ?? ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/45 text-[10px] flex-shrink-0">Light</span>
                <div className="flex flex-1 rounded overflow-hidden h-2">
                  {RADAR_LEGEND.map((color, i) => (
                    <div key={i} style={{ background: color, flex: 1 }} />
                  ))}
                </div>
                <span className="text-white/45 text-[10px] flex-shrink-0">Heavy</span>
              </div>
              <p className="text-white/30 text-[10px]">
                © RainViewer · {radarFrames.length} frames (~2h history + forecast)
              </p>
            </div>
          </div>
        )}

        {/* Clouds panel */}
        {activeLayer === 'clouds_new' && (
          <div className="absolute bottom-0 left-0 right-0 z-[800] p-3 pt-10 bg-gradient-to-t from-black/85 via-black/60 to-transparent pointer-events-none">
            <div className="pointer-events-auto rounded-xl bg-black/60 border border-white/15 backdrop-blur-md p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-white/45 text-[10px] flex-shrink-0">Clear</span>
                <div
                  className="flex-1 rounded overflow-hidden h-2"
                  style={{ background: 'linear-gradient(to right, rgba(180,200,220,0.05), rgba(180,200,230,0.35), rgba(200,215,235,0.6), rgba(220,230,245,0.8), rgba(240,245,255,0.95))' }}
                />
                <span className="text-white/45 text-[10px] flex-shrink-0">Overcast</span>
              </div>
              <p className="text-white/30 text-[10px]">© OpenWeatherMap</p>
            </div>
          </div>
        )}

        {/* Temperature panel */}
        {activeLayer === 'temp_new' && (
          <div className="absolute bottom-0 left-0 right-0 z-[800] p-3 pt-10 bg-gradient-to-t from-black/85 via-black/60 to-transparent pointer-events-none">
            <div className="pointer-events-auto rounded-xl bg-black/60 border border-white/15 backdrop-blur-md p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-blue-300 text-[10px] flex-shrink-0">Cold</span>
                <div
                  className="flex-1 rounded overflow-hidden h-2"
                  style={{ background: 'linear-gradient(to right, #000080, #0000ff, #00b4ff, #00ffff, #00ff80, #bfff00, #ffff00, #ffaa00, #ff4400, #cc0000)' }}
                />
                <span className="text-red-300 text-[10px] flex-shrink-0">Hot</span>
              </div>
              <p className="text-white/30 text-[10px]">© OpenWeatherMap</p>
            </div>
          </div>
        )}

        {/* Wind panel */}
        {activeLayer === 'wind_new' && (
          <div className="absolute bottom-0 left-0 right-0 z-[800] p-3 pt-10 bg-gradient-to-t from-black/85 via-black/60 to-transparent pointer-events-none">
            <div className="pointer-events-auto rounded-xl bg-black/60 border border-white/15 backdrop-blur-md p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-white/45 text-[10px] flex-shrink-0">Calm</span>
                <div
                  className="flex-1 rounded overflow-hidden h-2"
                  style={{ background: 'linear-gradient(to right, #003f7f, #0070c0, #00b0f0, #00e080, #a0f000, #ffe000, #ff8800, #ff2200, #990000)' }}
                />
                <span className="text-white/45 text-[10px] flex-shrink-0">Strong</span>
              </div>
              <p className="text-white/30 text-[10px]">© OpenWeatherMap</p>
            </div>
          </div>
        )}

        {/* Air Quality panel */}
        {activeLayer === 'air_pollution' && (
          <div className="absolute bottom-0 left-0 right-0 z-[800] p-3 pt-8 bg-gradient-to-t from-black/85 via-black/70 to-transparent pointer-events-none">
            <div className="pointer-events-auto rounded-xl bg-black/55 border border-white/15 backdrop-blur-md p-3 text-sm text-white">
              {airError && <p className="text-red-300">{airError}</p>}
              {!airError && !air && <p className="text-white/60">Loading…</p>}
              {aqiInfo && air && (
                <>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-white/70">OpenWeather Index (1–5)</span>
                    <span className={`font-bold ${aqiInfo.label === 'Unknown' ? 'text-white/50' : 'text-white'}`}>
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
                    Data for point ({lat.toFixed(2)}, {lon.toFixed(2)}). OpenWeather uses a different model than US EPA (1–6).
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
