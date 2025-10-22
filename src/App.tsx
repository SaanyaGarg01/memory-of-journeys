// src/App.tsx
import { useState, useEffect } from 'react';

// @ts-ignore
import { Compass, Plus, Search, TrendingUp, LogOut, User as UserIcon, Sun, Moon } from 'lucide-react';
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
import HomeButton from './components/HomeButton';

import { supabase, Journey, JourneyLeg } from './lib/supabase';
import { getTravelDNA } from './utils/travelDNA';
import { analyzeTextMood } from './utils/sentimentClient';
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

type ProfileData = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  bio?: string | null;
};
function App(): JSX.Element {
  const [view, setView] = useState<View>('hero');
  const [bonusFeatureView, setBonusFeatureView] = useState<BonusFeatureView>('overview');
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Theme state
const [theme, setTheme] = useState<'dark' | 'light'>(() => {
  try {
    const saved = localStorage.getItem('theme');
    return (saved as 'dark' | 'light') || 'dark';
  } catch {
    return 'dark';
  }
});

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

useEffect(() => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0f172a';
      document.body.style.color = '#ffffff';
  } else {
    document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f9fafb';
      document.body.style.color = '#000000';
  }

  try {
    localStorage.setItem('theme', theme);
  } catch {
    // ignore
  }
}, [theme]);

  // Listen to Firebase auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        setProfileLoading(true);
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', firebaseUser.uid)
            .single();

          if (error && error.code !== 'PGRST116') console.error('Supabase fetch error:', error);

          if (!data) {
            // create a profile row if not exists
            const { data: inserted, error: insertError } = await supabase
              .from('users')
              .insert({
                id: firebaseUser.uid,
                name: firebaseUser.displayName || '',
                email: firebaseUser.email || '',
                avatar_url: firebaseUser.photoURL || null,
                bio: ''
              })
              .select()
              .single();

            if (insertError) console.error('Error inserting new user:', insertError);
            setProfileData(inserted ?? null);
          } else {
            setProfileData({
              id: data.id,
              name: data.name || '',
              email: data.email || '',
              avatar_url: data.avatar_url ?? '',
              bio: data.bio ?? ''
            });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Load profile manually (exposed by navbar)
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
        console.error('Supabase fetch error:', error);
        setProfileData(null);
        return;
      }

      if (!data) {
        const { data: inserted, error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.uid,
            name: user.displayName || '',
            email: user.email || '',
            avatar_url: user.photoURL || null,
            bio: ''
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting new user:', insertError);
          setProfileData(null);
        } else {
          setProfileData(inserted ?? null);
        }
      } else {
        setProfileData({
          id: data.id,
          name: data.name || '',
          email: data.email || '',
          avatar_url: data.avatar_url ?? '',
          bio: data.bio ?? ''
        });
      }
    } catch (err) {
      console.error('Unexpected error loading profile:', err);
      setProfileData(null);
    } finally {
      setProfileLoading(false);
    }
  };

  // Load journeys (public explore feed)
  const loadJourneys = async (overrideType?: string) => {
    setLoading(true);
    try {
      const activeType = overrideType ?? filterType;
      const params = new URLSearchParams({ visibility: 'public', limit: '20' });
      if (activeType && activeType !== 'all') params.set('journey_type', activeType);
      const res = await fetch(`/api/journeys?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) setJourneys(data as Journey[]);
    } catch (error) {
      console.error('Error loading journeys:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // This handler accepts either a full Journey object (from DB) OR a small payload returned by JourneyBuilder.
  const handleJourneyComplete = async (payload: any) => {
    setLoading(true);
    try {
      // If payload looks like a saved journey (has id or created_at), use it directly.
      if (payload && (payload.id || payload.created_at)) {
        setJourneys(prev => [payload as Journey, ...prev]);
        setView('explore');
        return;
      }

      // Otherwise, try to derive full journey and save it
      const {
        title,
        legs,
        journeyType,
        keywords,
        departureDate,
        returnDate
      } = payload as {
        title?: string;
        legs?: JourneyLeg[];
        journeyType?: Journey['journey_type'];
        keywords?: string[];
        departureDate?: string;
        returnDate?: string;
      };

      const aiStory = generateAIStory(legs || [], journeyType || 'solo', keywords || []);
      const similarityScore = calculateSimilarityScore(legs || []);
      const rarityScore = calculateRarityScore(legs || [], journeyType || 'solo');
      const culturalInsights = getCulturalInsights(legs || []);

      const journeyUserId = user?.uid || `anon_${crypto.randomUUID()}`;

      const newJourney: Partial<Journey> = {
        title: title || 'Untitled Journey',
        description: '',
        journey_type: journeyType || 'solo',
        departure_date: departureDate || new Date().toISOString().slice(0, 10),
        return_date: returnDate || departureDate || new Date().toISOString().slice(0, 10),
        legs: legs || [],
        keywords: keywords || [],
        ai_story: aiStory,
        similarity_score: similarityScore,
        rarity_score: rarityScore,
        cultural_insights: culturalInsights,
        visibility: "public",
        likes_count: 0,
        views_count: 0,
        user_id: journeyUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistic UI update
      const optim = { ...(newJourney as Journey), id: '' };
      setJourneys(prev => [optim, ...prev]);
      setView('explore');

      // Save via backend API (MariaDB)
      const res = await fetch('/api/journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJourney)
      });
      if (res.ok) {
        const savedJourney = await res.json();
        setJourneys(prev => prev.map(j => (j.id === '' ? (savedJourney as Journey) : j)));
      } else {
        console.warn('Database save failed via API');
      }
    } catch (error) {
      console.error('Error creating journey:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle likes (persist to backend with optimistic update)
  const handleLike = async (journeyId: string) => {
    if (!journeyId) return; // skip optimistic placeholders
    setJourneys(prev => prev.map(j => j.id === journeyId ? { ...j, likes_count: (j.likes_count || 0) + 1 } : j));
    try {
      const res = await fetch(`/api/journeys/${encodeURIComponent(journeyId)}/like`, { method: 'POST' });
      if (res.ok) {
        const body = await res.json();
        setJourneys(prev => prev.map(j => j.id === journeyId ? { ...j, likes_count: body.likes_count ?? j.likes_count } : j));
        // Reload to ensure server value is reflected (in case of race conditions)
        void loadJourneys();
      }
    } catch (err) {
      console.warn('Like API failed', err);
    }
  };

  // Handle delete journey
  const handleDelete = async (journeyId: string) => {
    if (!journeyId) return;
    try {
      const res = await fetch(`/api/journeys/${encodeURIComponent(journeyId)}`, { method: 'DELETE' });
      if (res.status === 204 || res.status === 200) {
        setJourneys(prev => prev.filter(j => j.id !== journeyId));
        // Reload to reflect server state definitively
        void loadJourneys();
      }
    } catch (err) {
      console.warn('Delete API failed', err);
    }
  };

  // View tracking helpers
  const getViewerId = (): string => {
    try {
      const key = 'moj_viewer_id';
      const existing = localStorage.getItem(key);
      if (existing) return existing;
      const id = user?.uid || `anon_${crypto.randomUUID()}`;
      localStorage.setItem(key, id);
      return id;
    } catch {
      return user?.uid || 'anon';
    }
  };

  const handleShowViewers = async (journeyId: string) => {
    if (!journeyId) return;
    try {
      const viewer_id = getViewerId();
      // Record this view (unique by journey+viewer)
      await fetch(`/api/journeys/${encodeURIComponent(journeyId)}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewer_id })
      });
      // Fetch viewers list
      const res = await fetch(`/api/journeys/${encodeURIComponent(journeyId)}/views`);
      if (res.ok) {
        const body = await res.json();
        const total = Number(body.total || 0);
        setJourneys(prev => prev.map(j => j.id === journeyId ? { ...j, views_count: total } : j));
        const viewers: Array<{ viewer_id: string; created_at: string }> = body.viewers || [];
        const first = viewers.slice(0, 5).map(v => v.viewer_id).join(', ');
        alert(`Views: ${total}${first ? `\nRecent viewers: ${first}` : ''}`);
      }
    } catch (err) {
      console.warn('View tracking failed', err);
    }
  };

  const filteredJourneys = journeys.filter(journey => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    const matchesTitle = journey.title?.toLowerCase().includes(q);
    const matchesLegs = (journey.legs || []).some(leg =>
      (leg.fromCity || '').toLowerCase().includes(q) ||
      (leg.toCity || '').toLowerCase().includes(q)
    );
    return matchesTitle || matchesLegs;
  });

  // Not logged in view
  if (!user) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen gap-6 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-md border transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 ${
              theme === 'dark' 
                ? 'bg-slate-800/60 hover:bg-slate-700/60 border-slate-700' 
                : 'bg-gray-200/80 hover:bg-gray-300/80 border-gray-300'
            }`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-400 transition-all duration-300 animate-pulse" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700 transition-all duration-300" />
            )}
          </button>
        </div>

        <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Welcome to Memory of Journeys</h1>
        <p className={theme === 'dark' ? 'text-gray-300 text-center max-w-md' : 'text-gray-700 text-center max-w-md'}>
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

  // Logged-in UI
  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} min-h-screen bg-gradient-to-br ${theme === 'dark' ? 'from-slate-950 via-slate-900 to-slate-950' : 'from-white via-gray-50 to-white'}`}>
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-slate-900/80 border-slate-800' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('hero')}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Memory of Journeys</h1>
              <p className={`text-xs transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Powered by Supabase</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt="user" className="w-8 h-8 rounded-full border border-gray-600" />
              ) : <UserIcon className={`w-8 h-8 transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-gray-700'
              }`} />}
              <span className={`text-sm font-medium transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>{user.displayName}</span>

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
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                view === 'explore' 
                  ? 'bg-blue-500 text-white' 
                  : theme === 'dark' 
                    ? 'text-gray-300 hover:bg-slate-800' 
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Search className="inline w-4 h-4 mr-2" /> Explore
            </button>
            <button 
              onClick={() => setView('features')} 
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                view === 'features' 
                  ? 'bg-purple-500 text-white' 
                  : theme === 'dark' 
                    ? 'text-gray-300 hover:bg-slate-800' 
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="inline w-4 h-4 mr-2" /> AI Features
            </button>
            <button 
              onClick={() => setView('create')} 
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                view === 'create' 
                  ? 'bg-cyan-500 text-white' 
                  : theme === 'dark' 
                    ? 'text-gray-300 hover:bg-slate-800' 
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Plus className="inline w-4 h-4 mr-2" /> Create
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-md transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 ${
                theme === 'dark' 
                  ? 'bg-slate-800/60 hover:bg-slate-700/60' 
                  : 'bg-gray-200/80 hover:bg-gray-300/80'
              }`}
              aria-label="Toggle theme"
            >
              <div className="relative">
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-yellow-400 transition-all duration-300 animate-pulse" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700 transition-all duration-300" />
                )}
              </div>
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-20">
        {view === 'profile' && (
          <div className="max-w-4xl mx-auto px-6 py-12">
            {profileLoading ? (
              <div className={`text-center py-20 transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                <p className={`mt-4 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Loading profile...</p>
              </div>
            ) : (
              <Profile
                firebaseUser={user}
                profileData={{
                  id: profileData?.id || user.uid,
                  name: profileData?.name || user.displayName || '',
                  email: profileData?.email || user.email || '',
                  avatar_url: profileData?.avatar_url || user.photoURL || '',
                  bio: profileData?.bio || ''
                }}
                onProfileUpdate={setProfileData}
              />
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
                <h2 className={`text-4xl font-bold mb-4 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Why Memory of Journeys?</h2>
                <p className={`text-xl max-w-3xl mx-auto transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  We're not just storing travel data—we're preserving human experiences
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`p-8 rounded-xl border transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' 
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                }`}>
                  <div className="text-4xl mb-4">🔬</div>
                  <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>The Technology</h3>
                  <ul className={`space-y-2 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <li>• MariaDB Vector columns for 384-dim embeddings</li>
                    <li>• IVFFlat indexing for sub-100ms similarity search</li>
                    <li>• ColumnStore for analytics on millions of routes</li>
                    <li>• Row-level security for privacy-first design</li>
                    <li>• Real-time pattern matching with cosine similarity</li>
                  </ul>
                </div>

                <div className={`p-8 rounded-xl border transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' 
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                }`}>
                  <div className="text-4xl mb-4">❤️</div>
                  <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>The Human Touch</h3>
                  <ul className={`space-y-2 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <li>• AI-generated stories blending facts with culture</li>
                    <li>• Cultural insights from 100+ destinations</li>
                    <li>• Rarity scores showing journey uniqueness</li>
                    <li>• Pattern discovery connecting similar travelers</li>
                    <li>• Memory preservation for future generations</li>
                  </ul>
                </div>
              </div>

              <div className={`mt-12 p-8 rounded-2xl text-center border transition-all duration-300 ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-blue-500/30' 
                  : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
              }`}>
                <TrendingUp className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Beyond the Hackathon</h3>
                <p className={`max-w-2xl mx-auto mb-4 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Our vision: A global memory bank where every journey becomes part of humanity's
                  shared travel heritage, powered by MariaDB's innovative vector capabilities
                </p>
                <div className={`flex flex-wrap justify-center gap-4 text-sm transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
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
              <h2 className={`text-4xl font-bold mb-2 transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Create Your Journey</h2>
              <p className={`transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Tell us about your travels and watch AI transform them into a story
              </p>
            </div>

            <div className={`rounded-2xl p-8 border shadow-2xl transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' 
                : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
            }`}>
              <JourneyBuilder
                onJourneyComplete={(data: any) => {
                  // JourneyBuilder may return either a saved journey (DB row) or a small payload.
                  void handleJourneyComplete(data);
                }}
              />
            </div>

            {loading && (
              <div className="mt-8 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                <p className={`mt-4 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Generating your journey story...</p>
              </div>
            )}
          </div>
        )}

        {view === 'explore' && (
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="mb-8">
              <h2 className={`text-4xl font-bold mb-4 transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Explore Journeys</h2>

              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search destinations..."
                  className={`flex-1 px-6 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'bg-slate-800/50 border-slate-700 text-white placeholder-gray-500' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />

                <select
                  value={filterType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setFilterType(newType);
                    void loadJourneys(newType);
                  }}
                  className={`px-6 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'bg-slate-800/50 border-slate-700 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
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
                    onDelete={() => handleDelete(journey.id)}
                    onShowViewers={() => handleShowViewers(journey.id)}
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
              <p className={`text-xl transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
              }`}>Experience the future of travel memories with our advanced AI features</p>
            </div>

            <div className="space-y-8">
              {journeys.length > 0 && (
                <EmotionalMap
                  emotionalData={journeys.flatMap(journey =>
                    (journey.legs || []).map((leg: JourneyLeg) => {
                      const moodResult = analyzeTextMood(
                        `${journey.title} ${journey.ai_story || ''} ${journey.keywords?.join(' ') || ''}`
                      );
                      return {
                        date: journey.departure_date || new Date().toISOString(),
                        location: `${leg.toCity}, ${leg.toCountry}`,
                        score: moodResult.score / 5,
                        emotion: moodResult.label
                      };
                    })
                  ).slice(0, 10)}
                />
              )}

              {journeys.length > 0 && (
                <TravelDNAProfile personality={getTravelDNA(journeys.flatMap(j => j.legs))} />
              )}

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

              <MemoryMuseum
                journeys={journeys.slice(0, 10).map(journey => ({
                  id: journey.id,
                  title: journey.title,
                  imageUrl: undefined,
                  location: journey.legs[0] ? `${journey.legs[0].toCity}, ${journey.legs[0].toCountry}` : 'Unknown'
                }))}
              />

              {journeys.length > 0 && journeys[0].legs.length > 0 && (
                <ThenAndNow
                  location={`${journeys[0].legs[0].toCity}, ${journeys[0].legs[0].toCountry}`}
                  thenDate={journeys[0].departure_date || new Date().toISOString()}
                />
              )}

              {journeys.length > 0 && journeys[0].legs.length > 0 && (
                <WeatherMemory
                  location={`${journeys[0].legs[0].toCity}, ${journeys[0].legs[0].toCountry}`}
                  date={journeys[0].departure_date || new Date().toISOString()}
                  lat={0}
                  lon={0}
                />
              )}

              {bonusFeatureView === 'overview' && (
                <BonusFeatures onFeatureClick={(featureId) => {
                  setBonusFeatureView(featureId as BonusFeatureView);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} />
              )}

              {bonusFeatureView === 'postcards' && (
                <div className="space-y-4">
                  <button onClick={() => setBonusFeatureView('overview')} className="text-slate-400 hover:text-white transition-colors">← Back to Bonus Features</button>
                  <PostcardGenerator journeys={journeys} />
                </div>
              )}

              {bonusFeatureView === 'temperature' && (
                <div className="space-y-4">
                  <button onClick={() => setBonusFeatureView('overview')} className="text-slate-400 hover:text-white transition-colors">← Back to Bonus Features</button>
                  <MemoryTemperature journeys={journeys} />
                </div>
              )}

              {bonusFeatureView === 'voice' && (
                <div className="space-y-4">
                  <button onClick={() => setBonusFeatureView('overview')} className="text-slate-400 hover:text-white transition-colors">← Back to Bonus Features</button>
                  <VoiceJournaling onSave={(transcript) => {
                    console.log('Voice transcript saved:', transcript);
                    alert('Voice transcript saved! You can now add this to a journey.');
                    setBonusFeatureView('overview');
                  }} />
                </div>
              )}

              {bonusFeatureView === 'gallery' && (
                <div className="space-y-4">
                  <button onClick={() => setBonusFeatureView('overview')} className="text-slate-400 hover:text-white transition-colors">← Back to Bonus Features</button>
                  <InteractiveGallery journeys={journeys} />
                </div>
              )}

              {bonusFeatureView === 'friends' && (
                <div className="space-y-4">
                  <button onClick={() => setBonusFeatureView('overview')} className="text-slate-400 hover:text-white transition-colors">← Back to Bonus Features</button>
                  <FriendMemorySync journeys={journeys} />
                </div>
              )}

              {bonusFeatureView === 'whispers' && (
                <div className="space-y-4">
                  <button onClick={() => setBonusFeatureView('overview')} className="text-slate-400 hover:text-white transition-colors">← Back to Bonus Features</button>
                  <MemoryWhispers journeys={journeys} />
                </div>
              )}

              {journeys.length === 0 && (
                <div className="text-center py-20 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-2xl border border-slate-700">
                  <div className="text-6xl mb-4">✨</div>
                  <h3 className="text-3xl font-bold text-white mb-4">Create Your First Journey</h3>
                  <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                    Start creating journeys to unlock all AI-powered features including emotional analysis, travel DNA profiling, and personalized destination predictions!
                  </p>
                  <button onClick={() => setView('create')} className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105">Create Journey Now</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Home Button visible on all logged-in views */}
      <HomeButton onClick={() => setView('hero')} />

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
