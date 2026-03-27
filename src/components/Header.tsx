import { RefreshCw } from 'lucide-react';
import { useWeatherStore } from '../store/weatherStore';

interface HeaderProps {
  onRefresh: () => void;
}

export function Header({ onRefresh }: HeaderProps) {
  const { unit, toggleUnit, isLoading } = useWeatherStore();

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <span className="text-2xl">⛅</span>
        <span className="text-white font-bold text-xl tracking-tight">WeatherLia</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleUnit}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
        >
          °{unit === 'celsius' ? 'C' : 'F'}
        </button>
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>
    </header>
  );
}
