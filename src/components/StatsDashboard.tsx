import { Globe, Plane, Users, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function StatsDashboard() {
  const [stats, setStats] = useState({
    journeys: 0,
    countries: 0,
    travelers: 0,
    miles: 0
  });

  useEffect(() => {
    const targetStats = {
      journeys: 1247,
      countries: 145,
      travelers: 892,
      miles: 8940000
    };

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;

      setStats({
        journeys: Math.floor(targetStats.journeys * progress),
        countries: Math.floor(targetStats.countries * progress),
        travelers: Math.floor(targetStats.travelers * progress),
        miles: Math.floor(targetStats.miles * progress)
      });

      if (step >= steps) {
        clearInterval(timer);
        setStats(targetStats);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Global Journey Network
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Plane className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatNumber(stats.journeys)}
          </div>
          <div className="text-sm text-gray-400">Journeys Created</div>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Globe className="w-8 h-8 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatNumber(stats.countries)}
          </div>
          <div className="text-sm text-gray-400">Countries Visited</div>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatNumber(stats.travelers)}
          </div>
          <div className="text-sm text-gray-400">Active Travelers</div>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-8 h-8 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatNumber(Math.floor(stats.miles / 1000))}k
          </div>
          <div className="text-sm text-gray-400">Miles Traveled</div>
        </div>
      </div>
    </div>
  );
}
