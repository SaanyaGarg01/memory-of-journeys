import { useState } from 'react';
import { Plus, X, MapPin, Calendar, Sparkles } from 'lucide-react';
import { JourneyLeg } from '../lib/supabase';
import { sampleAirports } from '../data/sampleAirports';
import { analyzeTextMood } from '../utils/sentimentClient';
import { fetchHistoricalWeather } from '../utils/weatherHistory';
import { getTravelDNA } from '../utils/travelDNA';

interface JourneyBuilderProps {
  onJourneyComplete?: (data: any) => void;
}

export default function JourneyBuilder({ onJourneyComplete }: JourneyBuilderProps) {
  const [title, setTitle] = useState('');
  const [legs, setLegs] = useState<JourneyLeg[]>([
    { from: '', to: '', fromCity: '', toCity: '', fromCountry: '', toCountry: '' },
  ]);
  const [journeyType, setJourneyType] = useState('solo');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [loading, setLoading] = useState(false);

  // newly added: state to store computed insights so we can render them
  const [moodInsights, setMoodInsights] = useState<any>(null);
  const [weatherHistory, setWeatherHistory] = useState<any[]>([]);
  const [travelDNA, setTravelDNA] = useState<any>(null);

  const addLeg = () => setLegs([...legs, { from: '', to: '', fromCity: '', toCity: '', fromCountry: '', toCountry: '' }]);
  const removeLeg = (index: number) => legs.length > 1 && setLegs(legs.filter((_, i) => i !== index));

  const updateLeg = (index: number, field: 'from' | 'to', value: string) => {
    const newLegs = [...legs];
    const airport = sampleAirports.find((a) => a.iata === value);
    if (!airport) return;
    if (field === 'from') {
      newLegs[index] = { ...newLegs[index], from: value, fromCity: airport.city, fromCountry: airport.country };
    } else {
      newLegs[index] = { ...newLegs[index], to: value, toCity: airport.city, toCountry: airport.country };
    }
    setLegs(newLegs);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };
  const removeKeyword = (k: string) => setKeywords(keywords.filter((x) => x !== k));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLegs = legs.filter((leg) => leg.from && leg.to);
    if (!title || validLegs.length === 0 || !departureDate) return;
    setLoading(true);

    try {
      const moodText = [title, journeyType, ...keywords].join(' ');
      const mood = await analyzeTextMood(moodText);
      setMoodInsights(mood);

      const weather = await Promise.all(
        validLegs.map(async (leg) => {
          const airport = sampleAirports.find((a) => a.iata === leg.to);
          if (!airport) return { city: leg.toCity, data: null };
          const lat = (airport as any).latitude ?? (airport as any).lat;
          const lon = (airport as any).longitude ?? (airport as any).lon;
          const data = lat && lon ? await fetchHistoricalWeather(lat, lon, departureDate) : null;
          return { city: leg.toCity, data };
        })
      );
      setWeatherHistory(weather);

      const dna = getTravelDNA(validLegs);
      setTravelDNA(dna);

      onJourneyComplete?.({
        title, legs: validLegs, journeyType, keywords,
        departureDate, returnDate: returnDate || departureDate,
        moodInsights: mood, weatherHistory: weather, travelDNA: dna
      });
    } catch (err) {
      console.error('Journey enrichment failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const journeyTypes = [
    { value: 'solo', label: 'Solo Adventure', emoji: '🎒' },
    { value: 'family', label: 'Family Trip', emoji: '👨‍👩‍👧‍👦' },
    { value: 'backpacking', label: 'Backpacking', emoji: '🏕️' },
    { value: 'honeymoon', label: 'Honeymoon', emoji: '💑' },
    { value: 'business', label: 'Business', emoji: '💼' },
    { value: 'adventure', label: 'Adventure', emoji: '⛰️' },
  ];

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900/40 p-6 rounded-2xl shadow-lg backdrop-blur">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Journey Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Southeast Asia Adventure"
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Journey Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Journey Type</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {journeyTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setJourneyType(type.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  journeyType === type.value
                    ? 'border-blue-500 bg-blue-500/20 text-white'
                    : 'border-slate-700 bg-slate-800/30 text-gray-400 hover:border-slate-600'
                }`}
              >
                <div className="text-2xl mb-1">{type.emoji}</div>
                <div className="text-sm font-medium">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" /> Departure Date
            </label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" /> Return Date
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              min={departureDate}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Route Builder */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" /> Journey Route
          </label>
          {legs.map((leg, i) => (
            <div key={i} className="flex gap-3 items-center mb-2">
              <select
                value={leg.from}
                onChange={(e) => updateLeg(i, 'from', e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                required
              >
                <option value="">From</option>
                {sampleAirports.map((a) => (
                  <option key={a.iata} value={a.iata}>
                    {a.city} ({a.iata})
                  </option>
                ))}
              </select>
              <span className="text-gray-500">→</span>
              <select
                value={leg.to}
                onChange={(e) => updateLeg(i, 'to', e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                required
              >
                <option value="">To</option>
                {sampleAirports.map((a) => (
                  <option key={a.iata} value={a.iata}>
                    {a.city} ({a.iata})
                  </option>
                ))}
              </select>
              {legs.length > 1 && (
                <button onClick={() => removeLeg(i)} type="button" className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
          <button onClick={addLeg} type="button" className="mt-2 flex items-center text-blue-400 hover:text-blue-300 gap-2">
            <Plus className="w-4 h-4" /> Add Stop
          </button>
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Keywords</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              placeholder="temples, beaches, food..."
              className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
            />
            <button
              type="button"
              onClick={addKeyword}
              className="px-4 py-3 bg-blue-500/20 border border-blue-500 text-blue-400 rounded-lg hover:bg-blue-500/30"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {keywords.map((k) => (
                <span key={k} className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-300 text-sm flex items-center gap-2">
                  {k}
                  <button onClick={() => removeKeyword(k)} type="button" className="hover:text-blue-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all ${
            loading ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-600 hover:to-cyan-600 hover:scale-[1.02]'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          {loading ? 'Analyzing your Journey...' : 'Generate Journey Story'}
        </button>
      </form>

      {/* Results Section */}
      {(moodInsights || weatherHistory.length > 0 || travelDNA) && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6 mt-6 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-2">✨ Journey Insights</h2>

          {moodInsights && (
            <div>
              <h3 className="text-blue-400 font-medium">Mood Analysis</h3>
              <p className="text-gray-300">Label: <strong>{moodInsights.label}</strong></p>
              <p className="text-gray-400 text-sm">Score: {moodInsights.score}</p>
            </div>
          )}

          {weatherHistory.length > 0 && (
            <div>
              <h3 className="text-cyan-400 font-medium mt-4">Weather Forecast</h3>
              {weatherHistory.map((w, i) => (
                <div key={i} className="text-gray-300 text-sm">
                  {w.city}: {w.data ? `${w.data.label} (${w.data.tmin}°–${w.data.tmax}°C)` : 'No data'}
                </div>
              ))}
            </div>
          )}

          {travelDNA && (
            <div>
              <h3 className="text-pink-400 font-medium mt-4">Travel DNA</h3>
              <pre className="text-gray-300 text-sm bg-slate-900/50 p-3 rounded-lg overflow-auto">
                {JSON.stringify(travelDNA, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
