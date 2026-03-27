import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WeatherData } from '../types/weather';

interface WeatherStore {
  currentWeather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  unit: 'celsius' | 'fahrenheit';
  recentSearches: string[];
  favorites: string[];

  setWeather: (data: WeatherData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleUnit: () => void;
  addRecentSearch: (city: string) => void;
  toggleFavorite: (city: string) => void;
}

export const useWeatherStore = create<WeatherStore>()(
  persist(
    (set) => ({
      currentWeather: null,
      isLoading: false,
      error: null,
      unit: 'celsius',
      recentSearches: [],
      favorites: [],

      setWeather: (data) => set({ currentWeather: data, error: null }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      toggleUnit: () =>
        set((state) => ({
          unit: state.unit === 'celsius' ? 'fahrenheit' : 'celsius',
        })),
      addRecentSearch: (city) =>
        set((state) => {
          const filtered = state.recentSearches.filter(
            (s) => s.toLowerCase() !== city.toLowerCase()
          );
          return { recentSearches: [city, ...filtered].slice(0, 8) };
        }),
      toggleFavorite: (city) =>
        set((state) => {
          const isFav = state.favorites.some(
            (f) => f.toLowerCase() === city.toLowerCase()
          );
          return {
            favorites: isFav
              ? state.favorites.filter(
                  (f) => f.toLowerCase() !== city.toLowerCase()
                )
              : [...state.favorites, city],
          };
        }),
    }),
    {
      name: 'weather-store',
      partialize: (state) => ({
        unit: state.unit,
        recentSearches: state.recentSearches,
        favorites: state.favorites,
      }),
    }
  )
);
