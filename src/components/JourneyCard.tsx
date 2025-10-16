import { Heart, Eye, MapPin, Calendar, TrendingUp, Sparkles, Share2 } from 'lucide-react';
import { Journey } from '../lib/supabase';
import Globe3D from './Globe3D';

interface JourneyCardProps {
  journey: Journey;
  onLike?: () => void;
  isLiked?: boolean;
}

export default function JourneyCard({ journey, onLike, isLiked }: JourneyCardProps) {
  const getRarityColor = (score: number) => {
    if (score >= 80) return 'text-purple-400';
    if (score >= 60) return 'text-pink-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRarityLabel = (score: number) => {
    if (score >= 80) return 'Extremely Rare';
    if (score >= 60) return 'Rare';
    if (score >= 40) return 'Uncommon';
    return 'Common';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getJourneyIcon = (type: string) => {
    const icons: Record<string, string> = {
      solo: '🎒',
      family: '👨‍👩‍👧‍👦',
      backpacking: '🏕️',
      honeymoon: '💑',
      business: '💼',
      adventure: '⛰️',
    };
    return icons[type] || '✈️';
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
      <div className="relative h-64 bg-gradient-to-br from-blue-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Globe3D journeyLegs={journey.legs} className="opacity-80" />
        </div>

        <div className="absolute top-4 right-4 flex gap-2">
          <div className="px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm font-medium flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {journey.views_count || 0}
          </div>
          <button
            onClick={onLike}
            className={`px-3 py-1 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-1 transition-colors ${
              isLiked
                ? 'bg-red-500/80 text-white'
                : 'bg-black/60 text-white hover:bg-red-500/60'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            {journey.likes_count || 0}
          </button>
        </div>

        <div className="absolute top-4 left-4 flex gap-2">
          <div className="px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm font-medium">
            <span className="mr-1">{getJourneyIcon(journey.journey_type)}</span>
            {journey.journey_type}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">{journey.title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(journey.departure_date)}
              {journey.return_date && journey.return_date !== journey.departure_date &&
                ` - ${formatDate(journey.return_date)}`
              }
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {journey.legs.length} stops
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {journey.legs.map((leg, index) => (
            <div
              key={index}
              className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-300 text-sm flex items-center gap-1"
            >
              {leg.fromCity}
              <span className="text-gray-500">→</span>
              {leg.toCity}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {Math.round(journey.similarity_score)}%
            </div>
            <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Pattern Match
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getRarityColor(journey.rarity_score)}`}>
              {Math.round(journey.rarity_score)}
            </div>
            <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              {getRarityLabel(journey.rarity_score)}
            </div>
          </div>
        </div>

        {journey.ai_story && (
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-start gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <h4 className="text-sm font-semibold text-cyan-400">AI Story</h4>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{journey.ai_story}</p>
          </div>
        )}

        {journey.keywords && journey.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {journey.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-slate-700/50 rounded text-gray-400 text-xs"
              >
                #{keyword}
              </span>
            ))}
          </div>
        )}

        {Object.keys(journey.cultural_insights || {}).length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
              <span>🌍</span>
              Cultural Insights
            </h4>
            <div className="space-y-2 text-sm text-gray-300">
              {Object.entries(journey.cultural_insights).map(([city, data]: [string, any]) => (
                <div key={city}>
                  <div className="font-medium text-amber-300">{city}</div>
                  <div className="text-xs text-gray-400 mt-1">{data.culture}</div>
                  {data.highlights && (
                    <div className="text-xs text-gray-500 mt-1">
                      Top spots: {data.highlights.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="w-full py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-600"
        >
          <Share2 className="w-4 h-4" />
          Share Journey
        </button>
      </div>
    </div>
  );
}
