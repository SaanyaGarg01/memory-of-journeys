import { useState, useEffect } from 'react';
import { Shuffle, MapPin, Tag, ArrowLeftRight, Sparkles, Eye } from 'lucide-react';
import { User } from 'firebase/auth';

interface AnonymousMemory {
  id: string;
  title: string;
  story: string;
  location: string;
  travel_type: string;
  keywords: string[];
  created_at: string;
}

interface MemoryExchange {
  id: string;
  exchanged_at: string;
  memories: Array<{
    id: string;
    title: string;
    story: string;
    location: string;
  }>;
}

interface Journey {
  id: string;
  title: string;
  ai_story: string;
  journey_type: string;
  keywords: string[];
  legs: Array<{ toCity: string; toCountry: string }>;
}

interface Props {
  user: User | null;
  journeys: Journey[];
}

export default function AnonymousStoryExchange({ user, journeys }: Props) {
  const [availableMemories, setAvailableMemories] = useState<AnonymousMemory[]>([]);
  const [myExchanges, setMyExchanges] = useState<MemoryExchange[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<AnonymousMemory | null>(null);
  const [myMemoryToShare, setMyMemoryToShare] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedJourney, setSelectedJourney] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  useEffect(() => {
    loadAvailableMemories();
    if (user?.uid) loadMyExchanges();
  }, [filterType, user?.uid]);

  const loadAvailableMemories = async () => {
    setLoading(true);
    try {
      const params = filterType !== 'all' ? `?travel_type=${filterType}` : '';
      const res = await fetch(`/api/anonymous-memories${params}`);
      const data = await res.json();
      setAvailableMemories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMyExchanges = async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`/api/memory-exchanges/${user!.uid}`);
      const data = await res.json();
      setMyExchanges(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load exchanges:', err);
    }
  };

  const submitMemory = async () => {
    if (!selectedJourney || !user?.uid) return;
    const journey = journeys.find(j => j.id === selectedJourney);
    if (!journey) return;

    try {
      const location = journey.legs.length > 0
        ? `${journey.legs[0].toCity}, ${journey.legs[0].toCountry}`
        : '';

      const res = await fetch('/api/anonymous-memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journey_id: journey.id,
          user_id: user!.uid,
          title: journey.title,
          story: journey.ai_story || 'A memorable journey',
          location: location,
          travel_type: journey.journey_type,
          keywords: journey.keywords
        })
      });

      if (res.ok) {
        const newMemory = await res.json();
        setMyMemoryToShare(newMemory.id);
        setShowSubmitModal(false);
        alert('Memory submitted! You can now exchange it with another traveler.');
        await loadAvailableMemories();
      }
    } catch (err) {
      console.error('Failed to submit memory:', err);
    }
  };

  const exchangeMemories = async (theirMemoryId: string) => {
    if (!myMemoryToShare || !user?.uid) {
      alert('Please submit a memory first before exchanging!');
      return;
    }

    try {
      const res = await fetch('/api/memory-exchanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user1_id: user!.uid,
          user2_id: 'anonymous',
          memory1_id: myMemoryToShare,
          memory2_id: theirMemoryId
        })
      });

      if (res.ok) {
        const exchange = await res.json();
        setShowExchangeModal(true);
        setSelectedMemory(exchange.memories.find((m: any) => m.id === theirMemoryId) || null);
        await loadAvailableMemories();
        await loadMyExchanges();
        setMyMemoryToShare('');
      }
    } catch (err) {
      console.error('Failed to exchange memories:', err);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
          <Shuffle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Please Log In</h3>
          <p className="text-slate-400">You need to be logged in to access Anonymous Story Exchange</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Anonymous Story Exchange
            </h1>
            <p className="text-slate-400">Trade travel memories anonymously with fellow travelers worldwide</p>
          </div>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Submit Memory
          </button>
        </div>

        {/* Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-orange-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400 mb-1">My Exchanges</div>
                <div className="text-2xl font-bold text-white">{myExchanges.length}</div>
              </div>
              <ArrowLeftRight className="w-8 h-8 text-orange-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400 mb-1">Available Memories</div>
                <div className="text-2xl font-bold text-white">{availableMemories.length}</div>
              </div>
              <Shuffle className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400 mb-1">Ready to Trade</div>
                <div className="text-2xl font-bold text-white">{myMemoryToShare ? 'Yes' : 'No'}</div>
              </div>
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {['all', 'solo', 'family', 'adventure', 'backpacking'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterType === type
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
          <p className="text-slate-400 mt-4">Loading memories...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableMemories.map((memory) => (
            <div
              key={memory.id}
              className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 hover:border-orange-500 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Shuffle className="w-6 h-6 text-white" />
                </div>
                {memory.travel_type && (
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                    {memory.travel_type}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{memory.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-4 mb-4">{memory.story}</p>
              {memory.location && (
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                  <MapPin className="w-4 h-4" />
                  {memory.location}
                </div>
              )}
              {memory.keywords && memory.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {memory.keywords.slice(0, 3).map((keyword, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  setSelectedMemory(memory);
                  if (myMemoryToShare) {
                    exchangeMemories(memory.id);
                  } else {
                    alert('Please submit a memory first to exchange!');
                  }
                }}
                disabled={!myMemoryToShare}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                  myMemoryToShare
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {myMemoryToShare ? 'Exchange Memory' : 'Submit Yours First'}
              </button>
            </div>
          ))}
        </div>
      )}

      {availableMemories.length === 0 && !loading && (
        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
          <Shuffle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">No Memories Available</h3>
          <p className="text-slate-400 mb-6">Be the first to share an anonymous travel story!</p>
        </div>
      )}

      {/* My Exchanges Section */}
      {myExchanges.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Eye className="w-6 h-6" />
            My Exchanged Memories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myExchanges.map((exchange) => (
              <div key={exchange.id} className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                <div className="text-sm text-slate-500 mb-4">
                  Exchanged on {new Date(exchange.exchanged_at).toLocaleDateString()}
                </div>
                <div className="space-y-4">
                  {exchange.memories.map((memory) => (
                    <div key={memory.id} className="p-4 bg-slate-800 rounded-lg">
                      <h4 className="font-bold text-white mb-2">{memory.title}</h4>
                      <p className="text-slate-400 text-sm line-clamp-3 mb-2">{memory.story}</p>
                      {memory.location && (
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {memory.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Memory Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-8 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Submit an Anonymous Memory</h2>
            <p className="text-slate-400 mb-6">
              Choose one of your journeys to share anonymously. You'll be able to exchange it for another traveler's story.
            </p>
            <div className="space-y-3">
              {journeys.map((journey) => (
                <div
                  key={journey.id}
                  onClick={() => setSelectedJourney(journey.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedJourney === journey.id
                      ? 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 border-2 border-orange-500'
                      : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <h3 className="font-bold text-white mb-2">{journey.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                    {journey.ai_story || 'A memorable journey'}
                  </p>
                  {journey.legs.length > 0 && (
                    <div className="text-xs text-slate-500">
                      {journey.legs[0].toCity}, {journey.legs[0].toCountry}
                    </div>
                  )}
                </div>
              ))}
              {journeys.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <p>No journeys available. Create a journey first!</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitMemory}
                disabled={!selectedJourney}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Memory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exchange Success Modal */}
      {showExchangeModal && selectedMemory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Exchange Successful! 🎉</h2>
              <p className="text-slate-400">You've received a new travel story!</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">{selectedMemory.title}</h3>
              <p className="text-slate-300 mb-4">{selectedMemory.story}</p>
              {selectedMemory.location && (
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-4 h-4" />
                  {selectedMemory.location}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowExchangeModal(false)}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all"
            >
              Continue Exploring
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
