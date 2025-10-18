import { useState, useEffect } from 'react';
// @ts-ignore
import { Compass, Plus, Search, TrendingUp, LogOut, User as UserIcon } from 'lucide-react';
import HeroSection from './components/HeroSection';
import JourneyBuilder from './components/JourneyBuilder';
import JourneyCard from './components/JourneyCard';
import StatsDashboard from './components/StatsDashboard';
import FeaturesShowcase from './components/FeaturesShowcase';
import EmotionalMap from './components/EmotionalMap';
import TravelDNAProfile from './components/TravelDNAProfile';
import FutureMemoryPlanner from './components/FutureMemoryPlanner';
import MemoryMuseum from './components/MemoryMuseum';
import Profile from './components/Profile';
import ThenAndNow from './components/ThenAndNow';
import WeatherMemory from './components/WeatherMemory';
import BonusFeatures from './components/BonusFeatures';
import PostcardGenerator from './components/PostcardGenerator';
import VoiceJournaling from './components/VoiceJournaling';
import InteractiveGallery from './components/InteractiveGallery';
import MemoryTemperature from './components/MemoryTemperature';
import FriendMemorySync from './components/FriendMemorySync';
import MemoryWhispers from './components/MemoryWhispers';
import { supabase, Journey, JourneyLeg } from './lib/supabase';
import { getTravelDNA } from './utils/travelDNA';
import { analyzeTextMood } from './utils/sentimentClient';
import { testDatabaseConnection } from './dbTest';
import { auth, googleProvider } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  generateAIStory,
  calculateSimilarityScore,
  calculateRarityScore,
  getCulturalInsights,
} from './utils/aiStoryGenerator';

type View = 'hero' | 'create' | 'explore' | 'features' | 'profile';
type BonusFeatureView = 'overview' | 'postcards' | 'temperature' | 'voice' | 'gallery' | 'friends' | 'whispers';

function App(): JSX.Element {
  const [view, setView] = useState<View>('hero');
  const [bonusFeatureView, setBonusFeatureView] = useState<BonusFeatureView>('overview');
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; error?: string }>({ connected: true });
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Listen to Firebase auth changes
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    setUser(firebaseUser);

    if (firebaseUser) {
      setProfileLoading(true);
      try {
        // 1️⃣ Check if profile exists
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', firebaseUser.uid)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Supabase fetch error:', error);
        }

        if (!data) {
          // 2️⃣ Create profile if it doesn't exist
          const { data: inserted, error: insertError } = await supabase
            .from('users')
            .insert({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              avatar_url: firebaseUser.photoURL || '',
              bio: ''
            })
            .select()
            .single();

          if (insertError) console.error('Error inserting new user:', insertError);

          setProfileData(inserted);
        } else {
          setProfileData(data);
        }
      } catch (err) {
        console.error('Profile loading error:', err);
      } finally {
        setProfileLoading(false);
      }
    } else {
      setProfileData(null);
    }
  });

  return () => unsubscribe();
}, []);


  // DB connection check
  useEffect(() => {
    testDatabaseConnection().then(result => setDbStatus({ connected: result.connected, error: result.error }));
  }, []);

  // -------------------------
  // Load profile immediately
  const loadProfile = async () => {
  if (!user) return;

  setProfileLoading(true);
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.uid)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, ignore
      console.error('Supabase fetch error:', error);
      alert('Failed to fetch profile from Supabase.');
      setProfileData(null);
      return;
    }

    if (!data) {
      // If user not in DB, insert
      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          avatar_url: user.photoURL || '',
          bio: ''
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting new user:', insertError);
        alert('Failed to create your profile. Try again.');
        setProfileData(null);
      } else {
        setProfileData(inserted);
      }
    } else {
      setProfileData(data);
    }
  } catch (err) {
    console.error('Unexpected error loading profile:', err);
    alert('An unexpected error occurred while loading your profile.');
    setProfileData(null);
  } finally {
    setProfileLoading(false);
  }
};


  // -------------------------
  // Load journeys immediately
  const loadJourneys = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase.from('journeys').select('*').eq('visibility', 'public').order('created_at', { ascending: false }).limit(20);
      if (filterType !== 'all') query = query.eq('journey_type', filterType);

      const { data, error } = await query;
      if (error) throw error;
      if (data) setJourneys(data as Journey[]);
    } catch (error) {
      console.error('Error loading journeys:', error);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Google login
  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (error) { console.error('Google login failed:', error); }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('hero');
      setUser(null);
      setProfileData(null);
    } catch (error) { console.error('Logout failed:', error); }
  };

  // -------------------------
  // Create journey
  const handleJourneyComplete = async (data: {
    title: string;
    legs: JourneyLeg[];
    journeyType: Journey['journey_type'];
    keywords: string[];
    departureDate: string;
    returnDate: string;
  }) => {
    if (!user) return alert('Please sign in first!');
    setLoading(true);
    try {
      const aiStory = generateAIStory(data.legs, data.journeyType, data.keywords);
      const similarityScore = calculateSimilarityScore(data.legs);
      const rarityScore = calculateRarityScore(data.legs, data.journeyType);
      const culturalInsights = getCulturalInsights(data.legs);

      const newJourney: Journey = {
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
        visibility: "public",
        likes_count: 0,
        views_count: 0,
        id: '',
        user_id: '',
        created_at: '',
        updated_at: ''
      };

      // Create temporary journey for immediate display
      const tempJourney: Journey = {
        ...newJourney,
        visibility: 'public' as Journey['visibility'],
        id: `temp-${Date.now()}`,
        user_id: null as any, // Allow null for unauthenticated users
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add to local state immediately
      setJourneys([tempJourney, ...journeys]);
      
      // Show success message
      console.log('✅ Journey created successfully!');
      
      // Switch to explore view to see the journey
      setView('explore');

      // Try to save to database (will work if tables exist and RLS allows)
      try {
        const { data: savedJourney, error } = await supabase
          .from('journeys')
          .insert([{ ...newJourney, user_id: null }])
          .select()
          .single();

        if (error) {
          console.warn('⚠️ Database save failed:', error.message);
          console.log('💡 Journey saved locally. To persist to database:');
          console.log('   1. Ensure tables are created (run migration SQL)');
          console.log('   2. Add anonymous user policy (see fix_anonymous_journeys.sql)');
          
          // Show user-friendly message
          setTimeout(() => {
            alert('✅ Journey created!\n\n⚠️ Note: Saved locally only.\nRun database migration to persist data across sessions.');
          }, 500);
        } else {
          console.log('✅ Journey saved to database:', savedJourney);
          // Replace temp journey with real one from database
          setJourneys(prevJourneys => {
            const filtered = prevJourneys.filter(j => j.id !== tempJourney.id);
            return [savedJourney as Journey, ...filtered];
          });
          
          // Show success message
          setTimeout(() => {
            alert('✅ Journey created and saved successfully!');
          }, 500);
        }
      } catch (dbError) {
        console.warn('❌ Database error:', dbError);
        console.log('💡 Journey saved locally only.');
      }
    } catch (error) {
      console.error('Error creating journey:', error);
      alert('Failed to create journey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  const handleLike = (journeyId: string) => {
    setJourneys(prev => prev.map(j => j.id === journeyId ? { ...j, likes_count: j.likes_count + 1 } : j));
  };

  const filteredJourneys = journeys.filter(journey => {
    const matchesSearch =
      journey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      journey.legs.some(leg =>
        leg.fromCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leg.toCity.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesSearch;
  });

  // -------------------------
  // If not logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <h1 className="text-4xl font-bold text-white">Welcome to Memory of Journeys</h1>
        <p className="text-gray-400 text-center max-w-md">
          Sign in with Google to start creating and exploring journeys.
        </p>
        <button
          onClick={handleGoogleLogin}
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  // -------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('hero')}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Memory of Journeys</h1>
              <p className="text-xs text-gray-400">Powered by Supabase</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt="user" className="w-8 h-8 rounded-full border border-gray-600" />
              ) : <UserIcon className="w-8 h-8 text-white" />}
              <span className="text-sm text-gray-300 font-medium">{user.displayName}</span>
              <button
                onClick={async () => { setView('profile'); await loadProfile(); }}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1 text-sm"
              >
                Profile
              </button>
              <button onClick={handleLogout} className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-1 text-sm">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>

            <button
              onClick={async () => { setView('explore'); await loadJourneys(); }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${view === 'explore' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-slate-800'}`}
            >
              <Search className="inline w-4 h-4 mr-2" /> Explore
            </button>
            <button onClick={() => setView('features')} className={`px-4 py-2 rounded-lg font-medium transition-all ${view === 'features' ? 'bg-purple-500 text-white' : 'text-gray-300 hover:bg-slate-800'}`}>
              <TrendingUp className="inline w-4 h-4 mr-2" /> AI Features
            </button>
            <button onClick={() => setView('create')} className={`px-4 py-2 rounded-lg font-medium transition-all ${view === 'create' ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-slate-800'}`}>
              <Plus className="inline w-4 h-4 mr-2" /> Create
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-20">
     {view === 'profile' && (
  <div className="max-w-4xl mx-auto px-6 py-12">
    {profileLoading ? (
      <div className="text-center py-20 text-white">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        <p className="text-gray-400 mt-4">Loading profile...</p>
      </div>
    ) : profileData ? (
      <Profile
        firebaseUser={user!}
        profileData={profileData}
        onProfileUpdate={setProfileData}
      />
    ) : (
      <div className="text-center py-20 text-white">
        Failed to load profile.
      </div>
    )}
  </div>
)}



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

              {bonusFeatureView === 'friends' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setBonusFeatureView('overview')}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ← Back to Bonus Features
                  </button>
                  <FriendMemorySync journeys={journeys} />
                </div>
              )}

              {bonusFeatureView === 'whispers' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setBonusFeatureView('overview')}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ← Back to Bonus Features
                  </button>
                  <MemoryWhispers journeys={journeys} />
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
