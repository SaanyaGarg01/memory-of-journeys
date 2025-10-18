// Friend Memory Sync Feature - Combine journeys with friends
import { useState } from 'react';
import { Users, Plus, X, Sparkles, MapPin, Calendar, Heart } from 'lucide-react';

interface Journey {
  id: string;
  title: string;
  description: string;
  departure_date: string;
  return_date: string;
  legs: Array<{ from: string; to: string; fromCity: string; toCity: string }>;
  journey_type?: string;
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
}

interface SharedMoment {
  location: string;
  date: string;
  description: string;
  friends: string[];
  highlight: string;
}

interface FriendMemorySyncProps {
  journeys: Journey[];
}

export default function FriendMemorySync({ journeys }: FriendMemorySyncProps) {
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [friendName, setFriendName] = useState('');
  const [sharedMoments, setSharedMoments] = useState<SharedMoment[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mock friend suggestions (in production, would come from user database)
  const suggestedFriends: Friend[] = [
    { id: '1', name: 'Sarah Chen', avatar: '👩‍🦰' },
    { id: '2', name: 'Mike Rodriguez', avatar: '👨‍🦱' },
    { id: '3', name: 'Emma Watson', avatar: '👱‍♀️' },
    { id: '4', name: 'James Kim', avatar: '👨‍🦲' },
    { id: '5', name: 'Priya Sharma', avatar: '👩‍🦳' },
    { id: '6', name: 'Alex Johnson', avatar: '🧔' },
  ];

  const addFriend = (friend: Friend) => {
    if (!selectedFriends.find(f => f.id === friend.id)) {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  const addCustomFriend = () => {
    if (friendName.trim() && !selectedFriends.find(f => f.name === friendName)) {
      const customFriend: Friend = {
        id: `custom-${Date.now()}`,
        name: friendName.trim(),
        avatar: '👤'
      };
      setSelectedFriends([...selectedFriends, customFriend]);
      setFriendName('');
    }
  };

  const removeFriend = (friendId: string) => {
    setSelectedFriends(selectedFriends.filter(f => f.id !== friendId));
  };

  const analyzeSharedMoments = () => {
    if (selectedFriends.length === 0 || journeys.length === 0) return;

    setIsAnalyzing(true);

    // Simulate AI analysis of shared moments
    setTimeout(() => {
      const moments: SharedMoment[] = [];

      // Generate shared moments based on journeys
      journeys.slice(0, 5).forEach(journey => {
        journey.legs.forEach(leg => {
          // Randomly select friends who were present
          const presentFriends = selectedFriends
            .filter(() => Math.random() > 0.5)
            .slice(0, Math.max(1, Math.floor(Math.random() * selectedFriends.length)));

          if (presentFriends.length > 0) {
            const highlights = [
              `Discovered an amazing local restaurant together`,
              `Got lost but found a hidden gem`,
              `Watched the sunset from a perfect viewpoint`,
              `Had an unforgettable cultural experience`,
              `Shared laughs over a travel mishap`,
              `Celebrated a special moment together`,
              `Explored off-the-beaten-path locations`,
              `Made new friends with locals`,
            ];

            moments.push({
              location: `${leg.toCity}`,
              date: journey.departure_date,
              description: journey.description || journey.title,
              friends: presentFriends.map(f => f.name),
              highlight: highlights[Math.floor(Math.random() * highlights.length)]
            });
          }
        });
      });

      setSharedMoments(moments);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Friend Memory Sync</h2>
          <p className="text-slate-400 text-sm">Discover shared moments with travel companions</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Add Friends Section */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Travel Friends
          </h3>

          {/* Custom Friend Input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomFriend()}
              placeholder="Enter friend's name..."
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400"
            />
            <button
              onClick={addCustomFriend}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Add
            </button>
          </div>

          {/* Suggested Friends */}
          <div className="mb-4">
            <p className="text-sm text-slate-400 mb-2">Suggested friends:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedFriends.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => addFriend(friend)}
                  disabled={selectedFriends.find(f => f.id === friend.id) !== undefined}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-xl">{friend.avatar}</span>
                  <span className="text-sm text-white">{friend.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Friends */}
          {selectedFriends.length > 0 && (
            <div>
              <p className="text-sm font-medium text-white mb-2">Selected friends ({selectedFriends.length}):</p>
              <div className="flex flex-wrap gap-2">
                {selectedFriends.map(friend => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg"
                  >
                    <span className="text-lg">{friend.avatar}</span>
                    <span className="text-sm text-white">{friend.name}</span>
                    <button
                      onClick={() => removeFriend(friend.id)}
                      className="ml-1 text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Analyze Button */}
        {selectedFriends.length > 0 && journeys.length > 0 && (
          <button
            onClick={analyzeSharedMoments}
            disabled={isAnalyzing}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                Analyzing Shared Moments...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Find Shared Moments with AI
              </>
            )}
          </button>
        )}

        {/* Shared Moments Display */}
        {sharedMoments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                Shared Moments Discovered: {sharedMoments.length}
              </h3>
              <div className="text-pink-400">
                <Heart className="w-6 h-6 fill-current" />
              </div>
            </div>

            <div className="grid gap-4">
              {sharedMoments.map((moment, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-700/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-400" />
                      <h4 className="text-lg font-semibold text-white">{moment.location}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Calendar className="w-4 h-4" />
                      {new Date(moment.date).toLocaleDateString()}
                    </div>
                  </div>

                  <p className="text-slate-300 mb-3">{moment.description}</p>

                  <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-3 mb-3">
                    <p className="text-sm text-pink-300">
                      <strong>✨ AI Highlight:</strong> {moment.highlight}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-slate-400">With:</span>
                    {moment.friends.map((friendName, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-sm text-purple-200"
                      >
                        <Users className="w-3 h-3" />
                        {friendName}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600">
              <h4 className="text-lg font-semibold text-white mb-3">Journey Statistics</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">{sharedMoments.length}</div>
                  <div className="text-sm text-slate-400">Shared Moments</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-400">{selectedFriends.length}</div>
                  <div className="text-sm text-slate-400">Friends</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    {new Set(sharedMoments.map(m => m.location)).size}
                  </div>
                  <div className="text-sm text-slate-400">Locations</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty States */}
        {selectedFriends.length === 0 && (
          <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">Add friends to discover shared moments</p>
          </div>
        )}

        {journeys.length === 0 && selectedFriends.length > 0 && (
          <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">Create journeys to find shared memories with friends</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
          <p className="text-sm text-purple-300">
            <strong>💡 How it works:</strong> Add friends who traveled with you, and AI will analyze your journeys 
            to find shared moments, common experiences, and highlight special memories you created together.
          </p>
        </div>
      </div>
    </div>
  );
}
