import { useState } from 'react';
import { ChevronDown, Droplets, Wind, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWeatherStore } from '../store/weatherStore';
import { getWeatherEmoji, formatDate, formatTemp } from '../utils/weather';
import type { ForecastDay } from '../types/weather';

interface SevenDayForecastProps {
  days: ForecastDay[];
}

export function SevenDayForecast({ days }: SevenDayForecastProps) {
  const { unit } = useWeatherStore();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
    >
      <h3 className="text-white font-semibold mb-3">7-Day Forecast</h3>
      <div className="space-y-1">
        {days.map((day, i) => {
          const isExp = expanded === i;
          return (
            <div key={day.date}>
              <button
                onClick={() => setExpanded(isExp ? null : i)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                <span className="text-xl w-8 text-center">
                  {getWeatherEmoji(day.day.condition.code, 1)}
                </span>
                <span className="text-white/80 text-sm w-28 text-left">
                  {formatDate(day.date)}
                </span>
                {day.day.daily_chance_of_rain > 0 && (
                  <span className="text-blue-300 text-xs">
                    {day.day.daily_chance_of_rain}%
                  </span>
                )}
                <div className="flex-1" />
                <span className="text-white font-medium text-sm">
                  {formatTemp(day.day.maxtemp_c, day.day.maxtemp_f, unit)}
                </span>
                <span className="text-white/40 text-sm w-16 text-right">
                  {formatTemp(day.day.mintemp_c, day.day.mintemp_f, unit)}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-white/40 transition-transform ${isExp ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isExp && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <DetailItem icon={<Wind size={13} />} label="Wind" value={`${day.day.maxwind_kph} km/h`} />
                      <DetailItem icon={<Droplets size={13} />} label="Humidity" value={`${day.day.avghumidity}%`} />
                      <DetailItem icon={<Sun size={13} />} label="UV" value={String(day.day.uv)} />
                      <DetailItem label="🌧️ Precipitation" value={`${day.day.totalprecip_mm} mm`} />
                      <DetailItem label="🌅 Sunrise" value={day.astro.sunrise} />
                      <DetailItem label="🌇 Sunset" value={day.astro.sunset} />
                      <DetailItem label="🌙 Moon" value={day.astro.moon_phase} />
                      <DetailItem label="📝 Condition" value={day.day.condition.text} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/5 rounded-lg p-2">
      <div className="flex items-center gap-1 text-white/40 text-xs mb-0.5">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-white text-sm">{value}</div>
    </div>
  );
}
