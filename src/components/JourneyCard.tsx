import React, { useEffect, useState } from 'react';
import {
  Heart, Eye, MapPin, Calendar, TrendingUp, Sparkles, Share2,
  CloudSun, Brain
} from 'lucide-react';
import { Journey } from '../lib/supabase';
import Globe3D from './Globe3D';
import JourneyMap from './JourneyMap';
import InteractiveCityMap from './InteractiveCityMap';

// 🧠 AI + Weather utils
import { analyzeTextMood } from '../utils/sentimentClient';
import { getTravelDNA } from '../utils/travelDNA';

interface JourneyCardProps {
  journey: Journey;
  onLike?: () => void;
  isLiked?: boolean;
}

// 🔑 Your AccuWeather API key from .env
const ACCUWEATHER_API_KEY = import.meta.env.VITE_ACCUWEATHER_API_KEY;

export default function JourneyCard({ journey, onLike, isLiked }: JourneyCardProps) {
  const [moodSummary, setMoodSummary] = useState<string | null>(null);
  const [weatherSummary, setWeatherSummary] = useState<string | null>(null);
  const [travelDNA, setTravelDNA] = useState<string | null>(null);

  useEffect(() => {
    const runAnalysis = async () => {
      // 🧩 Sentiment
      const moodRes = analyzeTextMood(journey.ai_story || journey.title || '');
      if (moodRes) {
        setMoodSummary(`${moodRes.label} (${moodRes.score >= 0 ? '+' : ''}${moodRes.score})`);
      }

      // 🌤️ AccuWeather dynamic fetch
      const fetchWeather = async (city: string) => {
        try {
          // 1️⃣ Get location key
          const locRes = await fetch(
            `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${ACCUWEATHER_API_KEY}&q=${encodeURIComponent(city)}`
          );
          const locData = await locRes.json();
          if (!locData || locData.length === 0) return null;

          const locationKey = locData[0].Key;

          // 2️⃣ Get current conditions
          const weatherRes = await fetch(
            `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${ACCUWEATHER_API_KEY}`
          );
          const weatherData = await weatherRes.json();
          if (!weatherData || weatherData.length === 0) return null;

          return {
            text: weatherData[0].WeatherText,
            temp: weatherData[0].Temperature.Metric.Value
          };
        } catch (err) {
          console.error('❌ AccuWeather fetch failed:', err);
          return null;
        }
      };

      // Use first leg's fromCity or toCity dynamically
      const firstLeg = journey.legs?.[0];
      if (firstLeg) {
        const city = firstLeg.fromCity || firstLeg.toCity;
        if (city) {
          const weather = await fetchWeather(city);
          if (weather) {
            setWeatherSummary(`${city}: ${weather.text}, ${weather.temp}°C`);
          } else {
            setWeatherSummary('Weather data unavailable');
          }
        }
      }

      // 🧬 Travel DNA
      const dnaRes = getTravelDNA(journey.legs || []);
      if (dnaRes) setTravelDNA(dnaRes.summary ?? null);
    };

    runAnalysis();
  }, [journey]);

  // 🌈 Color helpers
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

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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

  const [showShare, setShowShare] = useState(false);

  const handleShare = async () => {
    const route = (journey.legs || [])
      .map((l) => `${l.fromCity} → ${l.toCity}`)
      .join(' | ');
    const storySnippet = journey.ai_story ? `${journey.ai_story.slice(0, 140)}...` : '';
    const url = window.location.href;
    const title = journey.title || 'My Journey';
    const text = storySnippet || `Explore my travel journey: ${title}`;
    const body = `${title}\n${text}\nRoute: ${route}\n${url}`.trim();

    // Try native share first
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `${text}\nRoute: ${route}`, url });
        return;
      }
      throw new Error('Web Share API not available');
    } catch (err) {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(body);
        alert('Journey details copied to clipboard!');
      } catch {
        alert(body);
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
      {/* Header */}
      <div className="relative h-64 bg-gradient-to-br from-blue-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Globe3D journeyLegs={journey.legs} className="opacity-80" />
        </div>

        {/* Views / Likes */}
        <div className="absolute top-4 right-4 flex gap-2">
          <div className="px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm font-medium flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {journey.views_count || 0}
          </div>
          <button
            onClick={onLike}
            className={`px-3 py-1 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-1 transition-colors ${
              isLiked ? 'bg-red-500/80 text-white' : 'bg-black/60 text-white hover:bg-red-500/60'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            {journey.likes_count || 0}
          </button>
        </div>

        {/* Type */}
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm font-medium">
            <span className="mr-1">{getJourneyIcon(journey.journey_type)}</span>
            {journey.journey_type}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">{journey.title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(journey.departure_date)}
              {journey.return_date && journey.return_date !== journey.departure_date && ` - ${formatDate(journey.return_date)}`}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {journey.legs.length} stops
            </span>
          </div>
        </div>

        {/* Legs */}
        <div className="flex flex-wrap gap-2">
          {journey.legs.map((leg, index) => (
            <div
              key={index}
              className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-300 text-sm flex items-center gap-1"
            >
              {leg.fromCity} <span className="text-gray-500">→</span> {leg.toCity}
            </div>
          ))}
        </div>

        {/* Mood + Weather */}
        {(moodSummary || weatherSummary) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {moodSummary && (
              <div className="px-3 py-1 bg-gradient-to-r from-pink-500/20 to-red-500/20 border border-pink-500/50 rounded-full text-pink-300 text-sm flex items-center gap-1">
                <Brain className="w-4 h-4" />
                {moodSummary}
              </div>
            )}
            {weatherSummary && (
              <div className="px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-full text-cyan-300 text-sm flex items-center gap-1">
                <CloudSun className="w-4 h-4" />
                {weatherSummary}
              </div>
            )}
          </div>
        )}

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{Math.round(journey.similarity_score)}%</div>
            <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" /> Pattern Match
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getRarityColor(journey.rarity_score)}`}>{Math.round(journey.rarity_score)}</div>
            <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" /> {getRarityLabel(journey.rarity_score)}
            </div>
          </div>
        </div>

        {/* AI Story */}
        {journey.ai_story && (
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-start gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <h4 className="text-sm font-semibold text-cyan-400">AI Story</h4>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{journey.ai_story}</p>
          </div>
        )}

        {/* Travel DNA */}
        {travelDNA && (
          <div className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-emerald-600/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
              <span>🧬</span> Travel DNA
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed">{travelDNA}</p>
          </div>
        )}

        {/* Journey Map */}
        {journey.legs && journey.legs.length > 0 && (
          <JourneyMap 
            journeyLegs={journey.legs} 
            title={journey.title}
            className="mt-4"
          />
        )}

        {/* Interactive City Map */}
        {journey.legs && journey.legs.length > 0 && (
          <InteractiveCityMap
            journeyLegs={journey.legs}
            className="mt-4"
          />
        )}

        {/* Keywords */}
        {journey.keywords && journey.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {journey.keywords.map((keyword, index) => (
              <span key={index} className="px-2 py-1 bg-slate-700/50 rounded text-gray-400 text-xs">#{keyword}</span>
            ))}
          </div>
        )}

        {/* Cultural Insights */}
        {Object.keys(journey.cultural_insights || {}).length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
              <span>🌍</span> Cultural Insights
            </h4>
            <div className="space-y-2 text-sm text-gray-300">
              {Object.entries(journey.cultural_insights).map(([city, data]: [string, any]) => (
                <div key={city}>
                  <div className="font-medium text-amber-300">{city}</div>
                  <div className="text-xs text-gray-400 mt-1">{data.culture}</div>
                  {data.highlights && (
                    <div className="text-xs text-gray-500 mt-1">Top spots: {data.highlights.slice(0, 3).join(', ')}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📤 Share Journey */}
        <div className="space-y-3">
          <button
            onClick={() => setShowShare((v) => !v)}
            className="w-full py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-600"
          >
            <Share2 className="w-4 h-4" />
            Share Journey
          </button>
          {showShare && (() => {
            const route = (journey.legs || [])
              .map((l) => `${l.fromCity} → ${l.toCity}`)
              .join(' | ');
            const storySnippet = journey.ai_story ? `${journey.ai_story.slice(0, 140)}...` : '';
            const url = window.location.href;
            const title = journey.title || 'My Journey';
            const text = storySnippet || `Explore my travel journey: ${title}`;
            const body = `${title}\n${text}\nRoute: ${route}\n${url}`.trim();
            const enc = encodeURIComponent;
            const wa = `https://wa.me/?text=${enc(body)}`;
            const mail = `mailto:?subject=${enc(title)}&body=${enc(body)}`;
            const tg = `https://t.me/share/url?url=${enc(url)}&text=${enc(`${text}\nRoute: ${route}`)}`;
            const tw = `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`;
            const fb = `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;
            const onInsta = async () => {
              try {
                await navigator.clipboard.writeText(body);
                alert('Copied share text. Paste it into Instagram DM or story.');
              } catch {
                alert(body);
              }
              window.open('https://www.instagram.com/', '_blank');
            };
            return (
              <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <a className="px-3 py-2 rounded bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-300 text-center" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>
                  <a className="px-3 py-2 rounded bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-300 text-center" href={mail}>Email</a>
                  <a className="px-3 py-2 rounded bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-600/30 text-cyan-300 text-center" href={tg} target="_blank" rel="noreferrer">Telegram</a>
                  <a className="px-3 py-2 rounded bg-sky-600/20 hover:bg-sky-600/30 border border-sky-600/30 text-sky-300 text-center" href={tw} target="_blank" rel="noreferrer">X / Twitter</a>
                  <a className="px-3 py-2 rounded bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-600/30 text-indigo-300 text-center" href={fb} target="_blank" rel="noreferrer">Facebook</a>
                  <button className="px-3 py-2 rounded bg-pink-600/20 hover:bg-pink-600/30 border border-pink-600/30 text-pink-300 text-center" onClick={onInsta}>Instagram</button>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={handleShare} className="flex-1 px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white border border-slate-600">Quick Share</button>
                  <button onClick={() => setShowShare(false)} className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white border border-slate-600">Close</button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
