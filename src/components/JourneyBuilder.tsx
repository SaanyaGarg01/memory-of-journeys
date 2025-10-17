import { useState } from 'react';
import { Plus, X, MapPin, Calendar, Sparkles } from 'lucide-react';
import { JourneyLeg } from '../lib/supabase';
import { sampleAirports } from '../data/sampleAirports';
import { analyzeTextMood } from '../utils/sentimentClient';
import { fetchHistoricalWeather } from '../utils/weatherHistory';
import { getTravelDNA} from '../utils/travelDNA';

interface JourneyBuilderProps {
  onJourneyComplete: (data: {
    title: string;
    legs: JourneyLeg[];
    journeyType: string;
    keywords: string[];
    departureDate: string;
    returnDate: string;
    moodInsights?: any;
    weatherHistory?: any;
    travelDNA?: any;
  }) => void;
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

  const addLeg = () => {
    setLegs([...legs, { from: '', to: '', fromCity: '', toCity: '', fromCountry: '', toCountry: '' }]);
  };

  const removeLeg = (index: number) => {
    if (legs.length > 1) {
      setLegs(legs.filter((_, i) => i !== index));
    }
  };

  const updateLeg = (index: number, field: 'from' | 'to', value: string) => {
    const newLegs = [...legs];
    const airport = sampleAirports.find((a) => a.iata === value);

    if (field === 'from' && airport) {
      newLegs[index].from = value;
      newLegs[index].fromCity = airport.city;
      newLegs[index].fromCountry = airport.country;
    } else if (field === 'to' && airport) {
      newLegs[index].to = value;
      newLegs[index].toCity = airport.city;
      newLegs[index].toCountry = airport.country;
    }

    setLegs(newLegs);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLegs = legs.filter((leg) => leg.from && leg.to);

    if (title && validLegs.length > 0 && departureDate) {
      setLoading(true);
      try {
        // Analyze journey sentiment
        const moodText = [title, journeyType, ...keywords].join(' ');
        const moodInsights = await analyzeTextMood(moodText);

        // Fetch weather for each destination city (using Open-Meteo)
        const weatherHistory = await Promise.all(
          validLegs.map(async (leg) => {
            // Find the airport entry for the destination IATA to get coordinates
            const airport = sampleAirports.find((a) => a.iata === leg.to);
            if (!airport) {
              console.warn('No airport found for', leg.to, leg.toCity);
              return { city: leg.toCity, data: null };
            }

            // support common coordinate property names (latitude/longitude or lat/lon)
            const lat = (airport as any).latitude ?? (airport as any).lat;
            const lon = (airport as any).longitude ?? (airport as any).lon;

            if (lat == null || lon == null) {
              console.warn('No coordinates available for', leg.to, leg.toCity);
              return { city: leg.toCity, data: null };
            }

            return {
              city: leg.toCity,
              data: await fetchHistoricalWeather(Number(lat), Number(lon), departureDate),
            };
          })
        );

        // Compute Travel DNA
        const travelDNA = getTravelDNA(validLegs);

        onJourneyComplete({
          title,
          legs: validLegs,
          journeyType,
          keywords,
          departureDate,
          returnDate: returnDate || departureDate,
          moodInsights,
          weatherHistory,
          travelDNA,
        });
      } catch (error) {
        console.error('Journey enrichment failed:', error);
        onJourneyComplete({
          title,
          legs: validLegs,
          journeyType,
          keywords,
          departureDate,
          returnDate: returnDate || departureDate,
        });
      } finally {
        setLoading(false);
      }
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Journey Title */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Journey Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Southeast Asia Adventure"
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <Calendar className="inline w-4 h-4 mr-1" />
            Departure Date
          </label>
          <input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Return Date
          </label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            min={departureDate}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Route Builder */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <MapPin className="inline w-4 h-4 mr-1" />
          Journey Route
        </label>
        <div className="space-y-3">
          {legs.map((leg, index) => (
            <div key={index} className="flex gap-3 items-center">
              <div className="flex-1 flex gap-3">
                <select
                  value={leg.from}
                  onChange={(e) => updateLeg(index, 'from', e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">From</option>
                  {sampleAirports.map((airport) => (
                    <option key={airport.iata} value={airport.iata}>
                      {airport.city} ({airport.iata})
                    </option>
                  ))}
                </select>
                <span className="text-gray-500 flex items-center">→</span>
                <select
                  value={leg.to}
                  onChange={(e) => updateLeg(index, 'to', e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">To</option>
                  {sampleAirports.map((airport) => (
                    <option key={airport.iata} value={airport.iata}>
                      {airport.city} ({airport.iata})
                    </option>
                  ))}
                </select>
              </div>
              {legs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLeg(index)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLeg}
          className="mt-3 flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Stop
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
            className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={addKeyword}
            className="px-4 py-3 bg-blue-500/20 border border-blue-500 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-300 text-sm flex items-center gap-2"
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
                  className="hover:text-blue-100"
                >
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
          loading ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-600 hover:to-cyan-600 hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        <Sparkles className="w-5 h-5" />
        {loading ? 'Analyzing your Journey...' : 'Generate Journey Story'}
      </button>
    </form>
  );
}
