// Future Memory Planner - AI-powered trip suggestions
import { useState } from 'react';
import { Compass, Sparkles, MapPin, Calendar } from 'lucide-react';

interface TripSuggestion {
  destination: string;
  reason: string;
  matchScore: number;
  bestTime: string;
  highlights: string[];
}

interface FutureMemoryPlannerProps {
  travelPreferences: {
    explorer: number;
    wanderer: number;
    seeker: number;
    relaxer: number;
  };
}

export default function FutureMemoryPlanner({ travelPreferences }: FutureMemoryPlannerProps) {
  const [suggestions] = useState<TripSuggestion[]>(generateSuggestions(travelPreferences));

  return (
    <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 backdrop-blur-sm rounded-2xl p-6 border border-emerald-700/50">
      <div className="flex items-center gap-3 mb-6">
        <Compass className="w-6 h-6 text-emerald-400" />
        <h3 className="text-2xl font-bold text-white">Future Memory Planner</h3>
        <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
      </div>

      <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
        <p className="text-slate-300 text-sm">
          Based on your travel patterns and preferences, here are destinations perfectly matched for you:
        </p>
      </div>

      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-emerald-500/50 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-lg font-bold text-white">{suggestion.destination}</h4>
                </div>
                <p className="text-sm text-slate-400 mt-1">{suggestion.reason}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-400">{suggestion.matchScore}%</div>
                <div className="text-xs text-slate-400">Match</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-300 mb-3">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Best time: {suggestion.bestTime}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestion.highlights.map((highlight, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs"
                >
                  {highlight}
                </span>
              ))}
            </div>

            <button className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors opacity-0 group-hover:opacity-100">
              Plan This Journey
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center text-sm text-slate-400">
        ✨ Predictions improve as you add more journeys
      </div>
    </div>
  );
}

function generateSuggestions(preferences: any): TripSuggestion[] {
  const suggestions: TripSuggestion[] = [];

  if (preferences.explorer > 40) {
    suggestions.push({
      destination: 'Bhutan - Land of Thunder Dragon',
      reason: 'Your adventurous spirit would thrive in the Himalayan trails and ancient monasteries.',
      matchScore: 92,
      bestTime: 'March-May, Sep-Nov',
      highlights: ['Mountain Treks', 'Buddhist Culture', 'Pristine Nature']
    });
  }

  if (preferences.seeker > 30) {
    suggestions.push({
      destination: 'Kyoto, Japan',
      reason: 'Perfect for seekers - blend of zen temples, tradition, and mindfulness.',
      matchScore: 88,
      bestTime: 'March-April (Cherry Blossoms)',
      highlights: ['Temples', 'Tea Ceremonies', 'Meditation']
    });
  }

  if (preferences.relaxer > 35) {
    suggestions.push({
      destination: 'Maldives',
      reason: 'Ultimate relaxation in overwater bungalows with crystal clear waters.',
      matchScore: 85,
      bestTime: 'November-April',
      highlights: ['Beach Paradise', 'Water Villas', 'Diving']
    });
  }

  if (preferences.wanderer > 40) {
    suggestions.push({
      destination: 'Tokyo, Japan',
      reason: 'Urban explorer\'s dream - neon lights, culture, and endless discovery.',
      matchScore: 90,
      bestTime: 'October-November',
      highlights: ['City Life', 'Food Culture', 'Modern & Traditional']
    });
  }

  // Add a wildcard suggestion
  suggestions.push({
    destination: 'Iceland - Land of Fire & Ice',
    reason: 'A unique blend of adventure, nature, and tranquility.',
    matchScore: 82,
    bestTime: 'June-August (Midnight Sun)',
    highlights: ['Northern Lights', 'Geothermal Spas', 'Waterfalls']
  });

  return suggestions.slice(0, 3);
}
