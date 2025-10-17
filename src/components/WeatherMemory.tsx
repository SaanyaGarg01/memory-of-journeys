// Weather Memory - Historical weather display
import { useEffect, useState } from 'react';
import { Cloud, Droplets, Wind } from 'lucide-react';
import { HistoricalWeather, fetchHistoricalWeather } from '../utils/weatherHistory';

interface WeatherMemoryProps {
  location: string;
  date: string;
  lat?: number;
  lon?: number;
}

export default function WeatherMemory({ location, date, lat = 0, lon = 0 }: WeatherMemoryProps) {
  const [weather, setWeather] = useState<HistoricalWeather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      const data = await fetchHistoricalWeather(lat, lon, date);
      setWeather(data);
      setLoading(false);
    };

    fetchWeather();
  }, [lat, lon, date]);

  if (loading) {
    return (
      <div className="bg-blue-900/20 backdrop-blur-sm rounded-xl p-4 border border-blue-700/30 animate-pulse">
        <div className="h-20 bg-blue-800/20 rounded"></div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur-sm rounded-xl p-4 border border-blue-700/50">
      <div className="flex items-center gap-2 mb-3">
        <Cloud className="w-5 h-5 text-blue-400" />
        <h4 className="text-sm font-semibold text-white">Memory Weather</h4>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold text-white">{weather.tmax}°C</div>
          <div className="text-sm text-blue-200 capitalize">{weather.label}</div>
          <div className="text-xs text-slate-400 mt-1">{new Date(date).toLocaleDateString()}</div>
        </div>

        <div className="text-6xl">🌤️</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-xs text-slate-400">Min Temp</div>
            <div className="text-sm font-medium text-white">{weather.tmin}°C</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
          <Wind className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-xs text-slate-400">Max Temp</div>
            <div className="text-sm font-medium text-white">{weather.tmax}°C</div>
          </div>
        </div>
      </div>

      <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
        <p className="text-sm text-slate-300 italic">
          "It was {weather.label.toLowerCase()} on {new Date(weather.date).toLocaleDateString()} when you visited {location}."
        </p>
      </div>
    </div>
  );
}
