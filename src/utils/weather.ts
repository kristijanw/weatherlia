export function getWeatherEmoji(code: number, isDay: number): string {
  if (code === 0 || code === 1) return isDay ? '☀️' : '🌙';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 57) return '🌦️';
  if (code >= 61 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '🌨️';
  if (code >= 80 && code <= 82) return '🌧️';
  if (code === 85 || code === 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌡️';
}

export function getWeatherGradient(code: number, isDay: number): string {
  if (!isDay) return 'bg-gradient-to-br from-[#171726] to-[#0c0c12]';
  if (code === 0 || code === 1) return 'bg-gradient-to-br from-[#f99e1f] to-[#f2590d]';
  if (code === 3) return 'bg-gradient-to-br from-[#47536b] to-[#363d49]';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return 'bg-gradient-to-br from-[#2e426b] to-[#1b2232]';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return 'bg-gradient-to-br from-[#9cb3c9] to-[#60809f]';
  return 'bg-gradient-to-br from-[#2d3a52] to-[#1e2535]';
}

export function getUVLabel(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: 'Low', color: 'text-green-400' };
  if (uv <= 5) return { label: 'Moderate', color: 'text-yellow-400' };
  if (uv <= 7) return { label: 'High', color: 'text-orange-400' };
  if (uv <= 10) return { label: 'Very High', color: 'text-red-400' };
  return { label: 'Extreme', color: 'text-purple-400' };
}

export function getEpaAqiLabel(index: number): { label: string; color: string } {
  switch (index) {
    case 1:
      return { label: 'Good', color: 'text-emerald-300' };
    case 2:
      return { label: 'Moderate', color: 'text-lime-300' };
    case 3:
      return { label: 'Unhealthy for Sensitive Groups', color: 'text-yellow-300' };
    case 4:
      return { label: 'Unhealthy', color: 'text-orange-400' };
    case 5:
      return { label: 'Very Unhealthy', color: 'text-red-400' };
    case 6:
      return { label: 'Hazardous', color: 'text-purple-400' };
    default:
      return { label: 'Unknown', color: 'text-white/60' };
  }
}

export function getEpaAqiBarSegmentClass(index: number): string {
  switch (index) {
    case 1:
      return 'bg-emerald-400';
    case 2:
      return 'bg-lime-400';
    case 3:
      return 'bg-yellow-400';
    case 4:
      return 'bg-orange-500';
    case 5:
      return 'bg-red-500';
    case 6:
      return 'bg-purple-500';
    default:
      return 'bg-white/20';
  }
}

export function formatDate(dateStr: string): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const date = new Date(dateStr);
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';

  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTemp(tempC: number, tempF: number, unit: 'celsius' | 'fahrenheit'): string {
  return unit === 'celsius' ? `${Math.round(tempC)}°C` : `${Math.round(tempF)}°F`;
}

export function formatTempNum(tempC: number, tempF: number, unit: 'celsius' | 'fahrenheit'): number {
  return unit === 'celsius' ? Math.round(tempC) : Math.round(tempF);
}
