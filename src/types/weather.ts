export interface WeatherLocation {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  localtime: string;
}

export interface WeatherCondition {
  text: string;
  icon: string;
  code: number;
}

export interface CurrentWeather {
  temp_c: number;
  temp_f: number;
  feelslike_c: number;
  feelslike_f: number;
  humidity: number;
  wind_kph: number;
  wind_dir: string;
  pressure_mb: number;
  vis_km: number;
  uv: number;
  is_day: number;
  condition: WeatherCondition;
}

export interface HourWeather {
  time: string;
  temp_c: number;
  temp_f: number;
  chance_of_rain: number;
  condition: WeatherCondition;
}

export interface DayWeather {
  maxtemp_c: number;
  maxtemp_f: number;
  mintemp_c: number;
  mintemp_f: number;
  avghumidity: number;
  maxwind_kph: number;
  totalprecip_mm: number;
  uv: number;
  daily_chance_of_rain: number;
  condition: WeatherCondition;
}

export interface AstroData {
  sunrise: string;
  sunset: string;
  moon_phase: string;
}

export interface ForecastDay {
  date: string;
  day: DayWeather;
  astro: AstroData;
  hour: HourWeather[];
}

export interface WeatherAlert {
  headline: string;
  msgtype: string;
  severity: string;
  urgency: string;
  areas: string;
  category: string;
  certainty: string;
  event: string;
  note: string;
  effective: string;
  expires: string;
  desc: string;
  instruction: string;
}

export interface WeatherData {
  location: WeatherLocation;
  current: CurrentWeather;
  forecast: {
    forecastday: ForecastDay[];
  };
  alerts?: {
    alert: WeatherAlert[];
  };
}

export interface SearchResult {
  id: number;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  url: string;
}
