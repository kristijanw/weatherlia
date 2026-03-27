import { useState } from 'react';
import { TriangleAlert, X } from 'lucide-react';
import type { WeatherAlert } from '../types/weather';

interface WeatherAlertsProps {
  alerts: WeatherAlert[];
}

export function WeatherAlerts({ alerts }: WeatherAlertsProps) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const visible = alerts.filter((_, i) => !dismissed.has(i));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((alert, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-white"
        >
          <TriangleAlert size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-red-300">{alert.event}</p>
            {alert.headline && (
              <p className="text-xs text-white/70 mt-1">{alert.headline}</p>
            )}
          </div>
          <button
            onClick={() => setDismissed((prev) => new Set([...prev, i]))}
            className="text-white/50 hover:text-white transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
