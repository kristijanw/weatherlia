import { useCallback, useEffect, useRef, useState } from 'react';
import { useWeatherStore } from '../store/weatherStore';
import { fetchWeather } from '../api/weather';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { WeatherAlerts } from '../components/WeatherAlerts';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { CurrentWeatherCard } from '../components/CurrentWeatherCard';
import { HourlyForecast } from '../components/HourlyForecast';
import { SevenDayForecast } from '../components/SevenDayForecast';
import { WeatherMapCard } from '../components/WeatherMapCard';
import { syncFavoriteCityToWidget } from '../plugins/widgetSync';

const DEFAULT_CITY = 'London';

export function MainPage() {
  const { currentWeather, isLoading, error, favorites, setWeather, setLoading, setError, addRecentSearch } =
    useWeatherStore();
  const [city, setCity] = useState(DEFAULT_CITY);
  const hasLoaded = useRef(false);

  const load = useCallback(
    async (query: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWeather(query);
        setWeather(data);
        addRecentSearch(data.location.name);
        setCity(query);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [setWeather, setLoading, setError, addRecentSearch]
  );

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      const startCity = useWeatherStore.getState().favorites[0] ?? DEFAULT_CITY;
      load(startCity);
    }
  }, [load]);

  useEffect(() => {
    const lastStarred = favorites[favorites.length - 1] ?? '';
    void syncFavoriteCityToWidget(lastStarred);
  }, [favorites]);

  const alerts = currentWeather?.alerts?.alert ?? [];

  return (
    <div className="min-h-screen bg-[hsl(220,20%,10%)] text-white font-sans">
      <Header onRefresh={() => load(city)} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <SearchBar onSearch={(q) => load(q)} />

        {alerts.length > 0 && <WeatherAlerts alerts={alerts} />}

        {isLoading && <SkeletonLoader />}

        {error && !isLoading && (
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center">
            <p className="text-red-400 font-medium mb-1">Error</p>
            <p className="text-white/60 text-sm">{error}</p>
          </div>
        )}

        {!isLoading && !error && currentWeather && (
          <>
            <CurrentWeatherCard data={currentWeather} />
            <HourlyForecast forecastDays={currentWeather.forecast.forecastday} />
            <SevenDayForecast days={currentWeather.forecast.forecastday} />
            <WeatherMapCard
              lat={currentWeather.location.lat}
              lon={currentWeather.location.lon}
            />
          </>
        )}
      </main>
    </div>
  );
}
