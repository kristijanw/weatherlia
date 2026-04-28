import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, X, Star, Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { searchCities } from '../api/weather';
import { useWeatherStore } from '../store/weatherStore';
import type { SearchResult } from '../types/weather';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { recentSearches, favorites } = useWeatherStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const data = await searchCities(q);
      setResults(data);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(city: string) {
    setQuery('');
    setIsOpen(false);
    setResults([]);
    onSearch(city);
  }

  function handleGPS() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        handleSelect(`${latitude},${longitude}`);
      },
      () => {}
    );
  }

  const showDropdown = isOpen && (results.length > 0 || query.length === 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3">
        <Search size={18} className="text-white/50 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              handleSelect(query.trim());
            }
          }}
          placeholder="Search city or postal code..."
          className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm"
        />
        {isSearching && (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
        )}
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); }}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
        <button
          onClick={handleGPS}
          className="text-white/50 hover:text-white transition-colors flex-shrink-0"
          title="Use GPS location"
        >
          <MapPin size={18} />
        </button>
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[hsl(220,18%,14%)] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {query.length === 0 && (
              <>
                {favorites.length > 0 && (
                  <div className="p-2">
                    <p className="text-white/40 text-xs px-2 pb-1 flex items-center gap-1">
                      <Star size={11} /> Favourites
                    </p>
                    {favorites.slice(0, 5).map((city) => (
                      <button
                        key={city}
                        onClick={() => handleSelect(city)}
                        className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded-lg text-sm transition-colors"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
                {recentSearches.length > 0 && (
                  <div className="p-2 border-t border-white/5">
                    <p className="text-white/40 text-xs px-2 pb-1 flex items-center gap-1">
                      <Clock size={11} /> Recent
                    </p>
                    {recentSearches.slice(0, 5).map((city) => (
                      <button
                        key={city}
                        onClick={() => handleSelect(city)}
                        className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded-lg text-sm transition-colors"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
                {favorites.length === 0 && recentSearches.length === 0 && (
                  <div className="p-4 text-white/40 text-sm text-center">
                    Start typing to search cities
                  </div>
                )}
              </>
            )}
            {results.length > 0 && (
              <div className="p-2">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(`${r.lat},${r.lon}`)}
                    className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <span className="text-white text-sm">{r.name}</span>
                    <span className="text-white/50 text-xs ml-2">
                      {r.region && `${r.region}, `}{r.country}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
