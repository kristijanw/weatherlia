import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWeatherStore } from '../store/weatherStore';
import { getWeatherEmoji } from '../utils/weather';
import type { ForecastDay } from '../types/weather';

interface HourlyForecastProps {
  forecastDays: ForecastDay[];
}

export function HourlyForecast({ forecastDays }: HourlyForecastProps) {
  const { unit } = useWeatherStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const allHours = forecastDays.flatMap((day) => day.hour);
  const upcoming = allHours.filter((h) => new Date(h.time) >= now).slice(0, 24);

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Hourly Forecast</h3>
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {upcoming.map((hour, i) => {
          const time = new Date(hour.time);
          const isNow = i === 0;
          const label = isNow
            ? 'Now'
            : time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={hour.time}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl min-w-[64px] ${
                isNow ? 'bg-primary/20 border border-primary/30' : 'bg-white/5 border border-white/5'
              }`}
            >
              <span className="text-white/60 text-xs">{label}</span>
              <span className="text-xl">{getWeatherEmoji(hour.condition.code, 1)}</span>
              <span className="text-white font-medium text-sm">
                {unit === 'celsius' ? Math.round(hour.temp_c) : Math.round(hour.temp_f)}°
              </span>
              {hour.chance_of_rain > 0 && (
                <span className="text-blue-300 text-xs">{hour.chance_of_rain}%</span>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
