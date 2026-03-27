export function getWeatherEmoji(code: number, isDay: number): string {
  if (code === 1000) return isDay ? '☀️' : '🌙';
  if (code === 1003) return '⛅';
  if (code === 1006) return '☁️';
  if (code === 1009) return '☁️';
  if ([1030, 1135, 1147].includes(code)) return '🌫️';
  if ([1063, 1150, 1153, 1180, 1183].includes(code)) return '🌦️';
  if ([1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code)) return '🌧️';
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return '⛈️';
  if ([1066, 1114, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) return '🌨️';
  if ([1072, 1168, 1171, 1198, 1201, 1204, 1207, 1237, 1249, 1252, 1261, 1264].includes(code)) return '🧊';
  return '🌡️';
}

export function getWeatherGradient(code: number, isDay: number): string {
  if (!isDay) return 'bg-gradient-to-br from-[#171726] to-[#0c0c12]';
  if (code === 1000) return 'bg-gradient-to-br from-[#f99e1f] to-[#f2590d]';
  if ([1006, 1009].includes(code)) return 'bg-gradient-to-br from-[#47536b] to-[#363d49]';
  if ([1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code))
    return 'bg-gradient-to-br from-[#2e426b] to-[#1b2232]';
  if ([1066, 1114, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code))
    return 'bg-gradient-to-br from-[#9cb3c9] to-[#60809f]';
  return 'bg-gradient-to-br from-[#2d3a52] to-[#1e2535]';
}

export function getUVLabel(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: 'Nizak', color: 'text-green-400' };
  if (uv <= 5) return { label: 'Umjeren', color: 'text-yellow-400' };
  if (uv <= 7) return { label: 'Visok', color: 'text-orange-400' };
  if (uv <= 10) return { label: 'Vrlo visok', color: 'text-red-400' };
  return { label: 'Ekstremno', color: 'text-purple-400' };
}

export function formatDate(dateStr: string): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const date = new Date(dateStr);
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (dateStr === todayStr) return 'Danas';
  if (dateStr === tomorrowStr) return 'Sutra';

  return date.toLocaleDateString('hr-HR', {
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
