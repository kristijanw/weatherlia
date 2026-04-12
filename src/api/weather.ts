import type { WeatherData, SearchResult } from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

function wmoToText(wmo: number): string {
  const map: Record<number, string> = {
    0: 'Vedro',
    1: 'Uglavnom vedro',
    2: 'Djelomično oblačno',
    3: 'Oblačno',
    45: 'Magla',
    48: 'Smrzavajuća magla',
    51: 'Sitna kiša',
    53: 'Umjerena sitna kiša',
    55: 'Jaka sitna kiša',
    56: 'Smrzavajuća sitna kiša',
    57: 'Jaka smrzavajuća sitna kiša',
    61: 'Lagana kiša',
    63: 'Umjerena kiša',
    65: 'Jaka kiša',
    66: 'Smrzavajuća kiša',
    67: 'Jaka smrzavajuća kiša',
    71: 'Lagani snijeg',
    73: 'Umjeren snijeg',
    75: 'Jak snijeg',
    77: 'Snježne pahulje',
    80: 'Lagani pljuskovi',
    81: 'Umjereni pljuskovi',
    82: 'Jaki pljuskovi',
    85: 'Lagani snježni pljuskovi',
    86: 'Jaki snježni pljuskovi',
    95: 'Grmljavinska oluja',
    96: 'Oluja s laganom tučom',
    99: 'Oluja s jakom tučom',
  };
  return map[wmo] ?? 'Nepoznato';
}

function degreesToDir(deg: number): string {
  const dirs = ['S', 'SSI', 'SI', 'ISI', 'I', 'IJI', 'JI', 'JJI', 'J', 'JJZ', 'JZ', 'ZJZ', 'Z', 'ZSZ', 'SZ', 'SSZ'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function formatSunTime(isoStr: string): string {
  if (!isoStr) return '–';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });
}

function usAqiToEpaIndex(usAqi: number): number {
  if (usAqi <= 50) return 1;
  if (usAqi <= 100) return 2;
  if (usAqi <= 150) return 3;
  if (usAqi <= 200) return 4;
  if (usAqi <= 300) return 5;
  return 6;
}

async function geocode(query: string): Promise<{ lat: number; lon: number; name: string; country: string }> {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=1&language=hr&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Grad nije pronađen');
  const data = await res.json();
  if (!data.results?.length) throw new Error(`Grad "${query}" nije pronađen`);
  const r = data.results[0] as GeoResult;
  return { lat: r.latitude, lon: r.longitude, name: r.name, country: r.country ?? '' };
}

async function reverseGeocode(lat: number, lon: number): Promise<{ name: string; country: string }> {
  try {
    const url = `${NOMINATIM_URL}?lat=${lat}&lon=${lon}&format=json&accept-language=hr`;
    const res = await fetch(url, { headers: { 'User-Agent': 'WeatherLia/1.0' } });
    if (!res.ok) return { name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`, country: '' };
    const data = await res.json();
    const name =
      data.address?.city ??
      data.address?.town ??
      data.address?.village ??
      data.address?.county ??
      `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    return { name, country: data.address?.country ?? '' };
  } catch {
    return { name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`, country: '' };
  }
}

export async function fetchWeather(query: string): Promise<WeatherData> {
  let lat: number;
  let lon: number;
  let locationName: string;
  let locationCountry: string;

  const coordMatch = query.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (coordMatch) {
    lat = parseFloat(coordMatch[1]);
    lon = parseFloat(coordMatch[2]);
    const geo = await reverseGeocode(lat, lon);
    locationName = geo.name;
    locationCountry = geo.country;
  } else {
    const geo = await geocode(query);
    lat = geo.lat;
    lon = geo.lon;
    locationName = geo.name;
    locationCountry = geo.country;
  }

  const forecastUrl =
    `${FORECAST_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,visibility` +
    `&hourly=temperature_2m,precipitation_probability,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,relative_humidity_2m_max` +
    `&timezone=auto&forecast_days=7&wind_speed_unit=kmh`;

  const airUrl =
    `${AIR_QUALITY_URL}?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,us_aqi`;

  const [forecastRes, airRes] = await Promise.all([
    fetch(forecastUrl),
    fetch(airUrl).catch(() => null),
  ]);

  if (!forecastRes.ok) throw new Error('Greška pri dohvaćanju podataka o vremenu');
  const f = await forecastRes.json();
  const air = airRes?.ok ? await airRes.json() : null;

  const cur = f.current;
  const daily = f.daily;
  const hourly = f.hourly;

  // Air quality
  const usAqi = air?.current?.us_aqi ?? null;
  const epaIndex = usAqi !== null ? usAqiToEpaIndex(usAqi) : undefined;
  const airQuality = air
    ? {
        pm2_5: air.current?.pm2_5,
        pm10: air.current?.pm10,
        co: air.current?.carbon_monoxide,
        no2: air.current?.nitrogen_dioxide,
        o3: air.current?.ozone,
        'us-epa-index': epaIndex,
      }
    : undefined;

  // Build forecast days
  const forecastdays = (daily.time as string[]).map((date, i) => {
    const dayHours = (hourly.time as string[])
      .map((t, hi) => ({ t, hi }))
      .filter(({ t }) => t.startsWith(date))
      .map(({ hi }) => ({
        time: hourly.time[hi] as string,
        temp_c: hourly.temperature_2m[hi] as number,
        temp_f: ((hourly.temperature_2m[hi] as number) * 9) / 5 + 32,
        chance_of_rain: (hourly.precipitation_probability[hi] as number) ?? 0,
        condition: {
          text: wmoToText(hourly.weather_code[hi] as number),
          icon: '',
          code: hourly.weather_code[hi] as number,
        },
      }));

    const maxC = daily.temperature_2m_max[i] as number;
    const minC = daily.temperature_2m_min[i] as number;

    return {
      date,
      day: {
        maxtemp_c: maxC,
        maxtemp_f: (maxC * 9) / 5 + 32,
        mintemp_c: minC,
        mintemp_f: (minC * 9) / 5 + 32,
        avghumidity: (daily.relative_humidity_2m_max[i] as number) ?? 0,
        maxwind_kph: (daily.wind_speed_10m_max[i] as number) ?? 0,
        totalprecip_mm: (daily.precipitation_sum[i] as number) ?? 0,
        uv: (daily.uv_index_max[i] as number) ?? 0,
        daily_chance_of_rain: (daily.precipitation_probability_max[i] as number) ?? 0,
        condition: {
          text: wmoToText(daily.weather_code[i] as number),
          icon: '',
          code: daily.weather_code[i] as number,
        },
      },
      astro: {
        sunrise: formatSunTime(daily.sunrise[i] as string),
        sunset: formatSunTime(daily.sunset[i] as string),
        moon_phase: '',
      },
      hour: dayHours,
    };
  });

  return {
    location: {
      name: locationName,
      region: '',
      country: locationCountry,
      lat,
      lon,
      localtime: new Date().toISOString().slice(0, 16).replace('T', ' '),
    },
    current: {
      temp_c: cur.temperature_2m as number,
      temp_f: ((cur.temperature_2m as number) * 9) / 5 + 32,
      feelslike_c: cur.apparent_temperature as number,
      feelslike_f: ((cur.apparent_temperature as number) * 9) / 5 + 32,
      humidity: cur.relative_humidity_2m as number,
      wind_kph: cur.wind_speed_10m as number,
      wind_dir: degreesToDir(cur.wind_direction_10m as number),
      pressure_mb: cur.pressure_msl as number,
      vis_km: ((cur.visibility as number) ?? 0) / 1000,
      uv: (forecastdays[0]?.day.uv) ?? 0,
      is_day: cur.is_day as number,
      condition: {
        text: wmoToText(cur.weather_code as number),
        icon: '',
        code: cur.weather_code as number,
      },
      air_quality: airQuality,
    },
    forecast: {
      forecastday: forecastdays,
    },
  };
}

export async function searchCities(query: string): Promise<SearchResult[]> {
  if (query.length < 2) return [];
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=10&language=hr&format=json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.results) return [];
  return (data.results as GeoResult[]).map((r) => ({
    id: r.id,
    name: r.name,
    region: r.admin1 ?? '',
    country: r.country ?? '',
    lat: r.latitude,
    lon: r.longitude,
    url: '',
  }));
}
