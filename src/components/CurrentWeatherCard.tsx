import { Star, Droplets, Wind, Gauge, Eye, Sun, Thermometer, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWeatherStore } from '../store/weatherStore';
import {
  getWeatherEmoji,
  getWeatherGradient,
  getUVLabel,
  getEpaAqiLabel,
  getEpaAqiBarSegmentClass,
  formatTemp,
} from '../utils/weather';
import type { WeatherData } from '../types/weather';

interface CurrentWeatherCardProps {
  data: WeatherData;
}

export function CurrentWeatherCard({ data }: CurrentWeatherCardProps) {
  const { unit, favorites, toggleFavorite } = useWeatherStore();
  const { location, current } = data;
  const isFav = favorites.some((f) => f.toLowerCase() === location.name.toLowerCase());

  const gradient = getWeatherGradient(current.condition.code, current.is_day);
  const emoji = getWeatherEmoji(current.condition.code, current.is_day);
  const uv = getUVLabel(current.uv);
  const epaIndex = current.air_quality?.['us-epa-index'];
  const aqi = typeof epaIndex === 'number' ? getEpaAqiLabel(epaIndex) : null;
  const pm25 =
    typeof current.air_quality?.pm2_5 === 'number'
      ? `${Math.round(current.air_quality.pm2_5)} µg/m³`
      : null;

  const localDate = new Date(location.localtime).toLocaleDateString('hr-HR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const astro = data.forecast.forecastday[0]?.astro;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-6 ${gradient} relative overflow-hidden`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-white text-2xl font-bold">
            {location.name}
            {location.country && (
              <span className="text-white/60 text-base font-normal ml-2">{location.country}</span>
            )}
          </h2>
          <p className="text-white/60 text-sm capitalize">{localDate}</p>
        </div>
        <button
          onClick={() => toggleFavorite(location.name)}
          className={`p-2 rounded-lg transition-colors ${isFav ? 'text-yellow-400' : 'text-white/40 hover:text-white/70'}`}
        >
          <Star size={20} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Temp + condition */}
      <div className="flex items-end gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-7xl font-bold text-white leading-none">
            {unit === 'celsius' ? Math.round(current.temp_c) : Math.round(current.temp_f)}°
          </span>
          <span className="text-4xl">{emoji}</span>
        </div>
      </div>

      <p className="text-white/80 font-medium mb-1">{current.condition.text}</p>
      <p className="text-white/50 text-sm mb-6">
        Osjeća se kao {formatTemp(current.feelslike_c, current.feelslike_f, unit)}
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard icon={<Droplets size={16} />} label="Vlažnost" value={`${current.humidity}%`} />
        <StatCard
          icon={<Wind size={16} />}
          label="Vjetar"
          value={`${current.wind_kph} km/h ${current.wind_dir}`}
        />
        <StatCard icon={<Gauge size={16} />} label="Tlak" value={`${current.pressure_mb} mb`} />
        <StatCard icon={<Eye size={16} />} label="Vidljivost" value={`${current.vis_km} km`} />
        <StatCard
          icon={<Sun size={16} />}
          label="UV indeks"
          value={<span className={uv.color}>{current.uv} – {uv.label}</span>}
        />
        <StatCard
          icon={<Thermometer size={16} />}
          label="Izlazak / Zalazak"
          value={astro ? `${astro.sunrise} / ${astro.sunset}` : '–'}
        />
        <StatCard
          icon={<Leaf size={16} />}
          label="Kvaliteta zraka"
          value={
            aqi && typeof epaIndex === 'number' ? (
              <div className="space-y-2">
                <div>
                  <span className={aqi.color}>
                    {aqi.label} (EPA {epaIndex})
                  </span>
                  {pm25 && <span className="text-white/70"> · PM2.5 {pm25}</span>}
                </div>
                <div className="flex rounded overflow-hidden h-2 border border-white/15">
                  {[1, 2, 3, 4, 5, 6].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 ${getEpaAqiBarSegmentClass(step)} ${
                        step === epaIndex ? 'ring-2 ring-white/70 ring-inset z-10' : 'opacity-85'
                      }`}
                      title={`EPA ${step}`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-white/45 leading-tight">
                  EPA 1 = dobar zrak, 6 = opasno (US EPA)
                </p>
              </div>
            ) : (
              <span className="text-white/50">Nema podataka za ovu lokaciju</span>
            )
          }
        />
      </div>
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-white text-sm font-medium">{value}</div>
    </div>
  );
}
