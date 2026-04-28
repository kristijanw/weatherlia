const OWM_AIR_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';

export interface OwmAirPollutionResponse {
  coord: { lat: number; lon: number };
  list: Array<{
    main: { aqi: number };
    components: {
      co: number;
      no: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      nh3: number;
    };
    dt: number;
  }>;
}

export async function fetchOwmAirPollution(
  lat: number,
  lon: number,
  appId: string
): Promise<OwmAirPollutionResponse> {
  const url = `${OWM_AIR_URL}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(appId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Unable to load air quality data (OpenWeatherMap).');
  return res.json();
}

/** OpenWeatherMap CAQI 1–5 (main.aqi). */
export function getOwmAqiPresentation(aqi: number): {
  label: string;
  segmentClass: string;
  detail: string;
} {
  switch (aqi) {
    case 1:
      return {
        label: 'Good',
        segmentClass: 'bg-emerald-400',
        detail: 'Air is clean; normal outdoor activities are fine.',
      };
    case 2:
      return {
        label: 'Fair',
        segmentClass: 'bg-lime-400',
        detail: 'Acceptable for most; sensitive groups may experience mild symptoms.',
      };
    case 3:
      return {
        label: 'Moderate',
        segmentClass: 'bg-amber-400',
        detail: 'Sensitive groups should reduce prolonged outdoor exertion.',
      };
    case 4:
      return {
        label: 'Poor',
        segmentClass: 'bg-orange-500',
        detail: 'Health effects possible for all; reduce outdoor exertion.',
      };
    case 5:
      return {
        label: 'Very Poor',
        segmentClass: 'bg-red-500',
        detail: 'Health warning — avoid prolonged outdoor exposure.',
      };
    default:
      return {
        label: 'Unknown',
        segmentClass: 'bg-white/25',
        detail: '',
      };
  }
}
