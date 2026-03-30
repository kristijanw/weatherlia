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
  if (!res.ok) throw new Error('Nije moguće učitati kvalitetu zraka (OpenWeatherMap).');
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
        label: 'Dobro',
        segmentClass: 'bg-emerald-400',
        detail: 'Zrak je čist; normalne aktivnosti na otvorenom.',
      };
    case 2:
      return {
        label: 'Umjereno',
        segmentClass: 'bg-lime-400',
        detail: 'Prihvatljivo za većinu; osjetljive skupine mogu osjetiti blage simptome.',
      };
    case 3:
      return {
        label: 'Loše',
        segmentClass: 'bg-amber-400',
        detail: 'Osjetljive skupine trebaju smanjiti duži boravak na otvorenom.',
      };
    case 4:
      return {
        label: 'Vrlo loše',
        segmentClass: 'bg-orange-500',
        detail: 'Mogući zdravstveni učinci za sve; smanjite napor na otvorenom.',
      };
    case 5:
      return {
        label: 'Izrazito loše',
        segmentClass: 'bg-red-500',
        detail: 'Upozorenje zdravlju — izbjegavajte duži boravak na otvorenom.',
      };
    default:
      return {
        label: 'Nepoznato',
        segmentClass: 'bg-white/25',
        detail: '',
      };
  }
}
