import type { WeatherData, SearchResult } from '../types/weather';

const WEATHER_API_KEY = 'ac0de5ee55aa4d1f8c9124443262703';
const BASE_URL = 'https://api.weatherapi.com/v1';

export async function fetchWeather(query: string): Promise<WeatherData> {
  const url = `${BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(query)}&days=7&aqi=yes&alerts=yes&lang=hr`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Greška pri dohvaćanju podataka o vremenu');
  }
  return res.json();
}

export async function searchCities(query: string): Promise<SearchResult[]> {
  if (query.length < 2) return [];
  const url = `${BASE_URL}/search.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}
