import { useState, useEffect } from 'react';
import { Compass, Plus, Search, TrendingUp } from 'lucide-react';
import HeroSection from './components/HeroSection';
import JourneyBuilder from './components/JourneyBuilder';
import JourneyCard from './components/JourneyCard';
import StatsDashboard from './components/StatsDashboard';
import FeaturesShowcase from './components/FeaturesShowcase';
import EmotionalMap from './components/EmotionalMap';
import TravelDNAProfile from './components/TravelDNAProfile';
import FutureMemoryPlanner from './components/FutureMemoryPlanner';
import MemoryMuseum from './components/MemoryMuseum';
import ThenAndNow from './components/ThenAndNow';
import WeatherMemory from './components/WeatherMemory';
import BonusFeatures from './components/BonusFeatures';
import PostcardGenerator from './components/PostcardGenerator';
import VoiceJournaling from './components/VoiceJournaling';
import InteractiveGallery from './components/InteractiveGallery';
import MemoryTemperature from './components/MemoryTemperature';
import { supabase, Journey, JourneyLeg } from './lib/supabase';
import { getTravelDNA } from './utils/travelDNA';
import { analyzeTextMood } from './utils/sentimentClient';
import { testDatabaseConnection } from './dbTest';

import {
  generateAIStory,
  calculateSimilarityScore,
  calculateRarityScore,
  getCulturalInsights,
} from './utils/aiStoryGenerator';

type View = 'hero' | 'create' | 'explore' | 'features';
type BonusFeatureView = 'overview' | 'postcards' | 'temperature' | 'voice' | 'gallery';

function App() {
  const [view, setView] = useState<View>('hero');
  const [bonusFeatureView, setBonusFeatureView] = useState<BonusFeatureView>('overview');
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; error?: string }>({ connected: true });

  // Test database connection on mount
  useEffect(() => {
    testDatabaseConnection().then(result => {
      setDbStatus({ 
        connected: result.connected, 
        error: result.error 
      });
      if (!result.connected) {
        console.warn('⚠️ Database connection issue:', result.error);
        console.log('💡 App will work in demo mode - journeys stored in memory only');
      }
    });
  }, []);

  useEffect(() => {
    if (view === 'explore') {
      loadJourneys();
    }
  }, [view]);

  const loadJourneys = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('journeys')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(20);

      if (filterType !== 'all') {
        query = query.eq('journey_type', filterType);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) setJourneys(data as Journey[]);
    } catch (error) {
      console.error('Error loading journeys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJourneyComplete = async (data: {
    title: string;
    legs: JourneyLeg[];
    journeyType: Journey['journey_type'];
    keywords: string[];
    departureDate: string;
    returnDate: string;
  }) => {
    setLoading(true);

    try {
      const aiStory = generateAIStory(data.legs, data.journeyType, data.keywords);
      const similarityScore = calculateSimilarityScore(data.legs);
      const rarityScore = calculateRarityScore(data.legs, data.journeyType);
      const culturalInsights = getCulturalInsights(data.legs);

      const newJourney = {
        title: data.title,
        description: '',
        journey_type: data.journeyType,
        departure_date: data.departureDate,
        return_date: data.returnDate,
        legs: data.legs,
        keywords: data.keywords,
        ai_story: aiStory,
        similarity_score: similarityScore,
        rarity_score: rarityScore,
        cultural_insights: culturalInsights,
        visibility: 'public',
        likes_count: 0,
        views_count: 0,
      };

      const tempJourney: Journey = {
        ...newJourney,
        visibility: 'public' as Journey['visibility'],
        id: `temp-${Date.now()}`,
        user_id: 'demo-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setJourneys([tempJourney, ...journeys]);
      setView('explore');

      const { error } = await supabase
        .from('journeys')
        .insert([{ ...newJourney, user_id: 'demo-user' }]);

      if (error) {
        console.error('Error saving journey:', error);
      } else {
        loadJourneys();
      }
    } catch (error) {
      console.error('Error creating journey:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (journeyId: string) => {
    const journey = journeys.find(j => j.id === journeyId);
    if (!journey) return;

    const updatedJourneys = journeys.map(j =>
      j.id === journeyId
        ? { ...j, likes_count: j.likes_count + 1 }
        : j
    );
    setJourneys(updatedJourneys);
  };

  const filteredJourneys = journeys.filter(journey => {
    const matchesSearch = journey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      journey.legs.some(leg =>
        leg.fromCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leg.toCity.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('hero')}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Memory of Journeys</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400">Powered by Supabase</p>
                {dbStatus.connected ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-400">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-yellow-400" title={dbStatus.error}>
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    Demo Mode
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('explore')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                view === 'explore'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:bg-slate-800'
              }`}
            >
              <Search className="inline w-4 h-4 mr-2" />
              Explore
            </button>
            <button
              onClick={() => setView('features')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                view === 'features'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-300 hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="inline w-4 h-4 mr-2" />
              AI Features
            </button>
            <button
              onClick={() => setView('create')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                view === 'create'
                  ? 'bg-cyan-500 text-white'
                  : 'text-gray-300 hover:bg-slate-800'
              }`}
            >
              <Plus className="inline w-4 h-4 mr-2" />
              Create
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-20">
        {view === 'hero' && (
          <div>
            <HeroSection onGetStarted={() => setView('create')} />

            <div className="max-w-7xl mx-auto px-6 py-20">
              <StatsDashboard />
            </div>

            <FeaturesShowcase />

            <div className="max-w-7xl mx-auto px-6 py-20">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Why Memory of Journeys?
                </h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                  We're not just storing travel data—we're preserving human experiences
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700">
                  <div className="text-4xl mb-4">🔬</div>
                  <h3 className="text-2xl font-bold text-white mb-3">The Technology</h3>
                  <ul className="space-y-2 text-gray-400">
                    <li>• MariaDB Vector columns for 384-dim embeddings</li>
                    <li>• IVFFlat indexing for sub-100ms similarity search</li>
                    <li>• ColumnStore for analytics on millions of routes</li>
                    <li>• Row-level security for privacy-first design</li>
                    <li>• Real-time pattern matching with cosine similarity</li>
                  </ul>
                </div>

                <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700">
                  <div className="text-4xl mb-4">❤️</div>
                  <h3 className="text-2xl font-bold text-white mb-3">The Human Touch</h3>
                  <ul className="space-y-2 text-gray-400">
                    <li>• AI-generated stories blending facts with culture</li>
                    <li>• Cultural insights from 100+ destinations</li>
                    <li>• Rarity scores showing journey uniqueness</li>
                    <li>• Pattern discovery connecting similar travelers</li>
                    <li>• Memory preservation for future generations</li>
                  </ul>
                </div>
              </div>

              <div className="mt-12 p-8 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-2xl text-center">
                <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-3">
                  Beyond the Hackathon
                </h3>
                <p className="text-gray-300 max-w-2xl mx-auto mb-4">
                  Our vision: A global memory bank where every journey becomes part of humanity's
                  shared travel heritage, powered by MariaDB's innovative vector capabilities
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
                  <span>🌍 Live Travel APIs</span>
                  <span>📱 Mobile App</span>
                  <span>🤝 Tourism Partnerships</span>
                  <span>🎓 Educational Integration</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'create' && (
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white mb-2">Create Your Journey</h2>
              <p className="text-gray-400">
                Tell us about your travels and watch AI transform them into a story
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
              <JourneyBuilder
              onJourneyComplete={(data: any) => {
                // ensure we don't return a Promise where a void is expected and avoid strict type mismatch
                void handleJourneyComplete(data as any);
              }}
              />
            </div>

            {loading && (
              <div className="mt-8 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                <p className="text-gray-400 mt-4">Generating your journey story...</p>
              </div>
            )}
          </div>
        )}

        {view === 'explore' && (
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white mb-4">Explore Journeys</h2>

              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search destinations..."
                  className="flex-1 px-6 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    loadJourneys();
                  }}
                  className="px-6 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="solo">Solo</option>
                  <option value="family">Family</option>
                  <option value="backpacking">Backpacking</option>
                  <option value="honeymoon">Honeymoon</option>
                  <option value="business">Business</option>
                  <option value="adventure">Adventure</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                <p className="text-gray-400 mt-4">Loading journeys...</p>
              </div>
            ) : filteredJourneys.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-2xl font-bold text-white mb-2">No journeys yet</h3>
                <p className="text-gray-400 mb-6">Be the first to create a journey story!</p>
                <button
                  onClick={() => setView('create')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
                >
                  Create Journey
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredJourneys.map((journey) => (
                  <JourneyCard
                    key={journey.id}
                    journey={journey}
                    onLike={() => handleLike(journey.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'features' && (
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="mb-12 text-center">
              <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                AI-Powered Features
              </h2>
              <p className="text-xl text-slate-400">
                Experience the future of travel memories with our advanced AI features
              </p>
            </div>

            <div className="space-y-8">
              {/* Emotional Map - Shows sentiment analysis of journeys */}
              {journeys.length > 0 && (
                <EmotionalMap
                  emotionalData={journeys.flatMap(journey =>
                    journey.legs.map((leg: JourneyLeg) => {
                      const moodResult = analyzeTextMood(
                        `${journey.title} ${journey.ai_story || ''} ${journey.keywords?.join(' ') || ''}`
                      );
                      return {
                        date: journey.departure_date || new Date().toISOString(),
                        location: `${leg.toCity}, ${leg.toCountry}`,
                        score: moodResult.score / 5, // Normalize to -5 to 5
                        emotion: moodResult.label
                      };
                    })
                  ).slice(0, 10)}
                />
              )}

              {/* Travel DNA Profile - Personality analysis */}
              {journeys.length > 0 && (
                <TravelDNAProfile
                  personality={getTravelDNA(journeys.flatMap(j => j.legs))}
                />
              )}

              {/* Future Memory Planner - AI destination suggestions */}
              {journeys.length > 0 && (() => {
                const dna = getTravelDNA(journeys.flatMap(j => j.legs));
                return (
                  <FutureMemoryPlanner
                    travelPreferences={{
                      explorer: dna.adventure || 0,
                      wanderer: dna.city || 0,
                      seeker: dna.culture || 0,
                      relaxer: dna.nature || 0
                    }}
                  />
                );
              })()}

              {/* Memory Museum - 3D gallery */}
              <MemoryMuseum
                journeys={journeys.slice(0, 10).map(journey => ({
                  id: journey.id,
                  title: journey.title,
                  imageUrl: undefined,
                  location: journey.legs[0] ? `${journey.legs[0].toCity}, ${journey.legs[0].toCountry}` : 'Unknown'
                }))}
              />

              {/* Then & Now - Location comparison */}
              {journeys.length > 0 && journeys[0].legs.length > 0 && (
                <ThenAndNow
                  location={`${journeys[0].legs[0].toCity}, ${journeys[0].legs[0].toCountry}`}
                  thenDate={journeys[0].departure_date || new Date().toISOString()}
                />
              )}

              {/* Weather Memory - Historical weather */}
              {journeys.length > 0 && journeys[0].legs.length > 0 && (
                <WeatherMemory
                  location={`${journeys[0].legs[0].toCity}, ${journeys[0].legs[0].toCountry}`}
                  date={journeys[0].departure_date || new Date().toISOString()}
                  lat={0}
                  lon={0}
                />
              )}

              {/* Bonus Features */}
              {bonusFeatureView === 'overview' && (
                <BonusFeatures onFeatureClick={(featureId) => {
                  setBonusFeatureView(featureId as BonusFeatureView);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} />
              )}

              {bonusFeatureView === 'postcards' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setBonusFeatureView('overview')}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ← Back to Bonus Features
                  </button>
                  <PostcardGenerator journeys={journeys} />
                </div>
              )}

              {bonusFeatureView === 'temperature' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setBonusFeatureView('overview')}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ← Back to Bonus Features
                  </button>
                  <MemoryTemperature journeys={journeys} />
                </div>
              )}

              {bonusFeatureView === 'voice' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setBonusFeatureView('overview')}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ← Back to Bonus Features
                  </button>
                  <VoiceJournaling onSave={(transcript) => {
                    console.log('Voice transcript saved:', transcript);
                    // You can add logic here to save the transcript to a journey
                    alert('Voice transcript saved! You can now add this to a journey.');
                    setBonusFeatureView('overview');
                  }} />
                </div>
              )}

              {bonusFeatureView === 'gallery' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setBonusFeatureView('overview')}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ← Back to Bonus Features
                  </button>
                  <InteractiveGallery journeys={journeys} />
                </div>
              )}

              {/* Call to action */}
              {journeys.length === 0 && (
                <div className="text-center py-20 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-2xl border border-slate-700">
                  <div className="text-6xl mb-4">✨</div>
                  <h3 className="text-3xl font-bold text-white mb-4">Create Your First Journey</h3>
                  <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                    Start creating journeys to unlock all AI-powered features including emotional analysis,
                    travel DNA profiling, and personalized destination predictions!
                  </p>
                  <button
                    onClick={() => setView('create')}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
                  >
                    Create Journey Now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="bg-slate-950 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Memory of Journeys</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Transforming travel data into human stories with MariaDB Vector Search
            </p>
            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <span>Built for MariaDB Hackathon 2025</span>
              <span>•</span>
              <span>Powered by pgvector & AI</span>
              <span>•</span>
              <span>Theme: Innovation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
