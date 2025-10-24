import { useState, useEffect } from 'react';
import { Users, Plus, Share2, X, Globe, UserPlus, Trash2 } from 'lucide-react';
import { User } from 'firebase/auth';

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  friend_name: string;
  friend_email: string;
  friend_avatar: string;
  status: string;
  added_at: string;
}

interface MemoryCircle {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  role: string;
  created_at: string;
  members?: Array<{ user_id: string; role: string }>;
  journeys?: Array<{ id: string; title: string; shared_by: string }>;
}

interface Journey {
  id: string;
  title: string;
  description: string;
  legs: Array<{ fromCity: string; toCity: string; toCountry: string }>;
}

interface Props {
  user: User | null;
  journeys: Journey[];
}

export default function MemoryCircles({ user, journeys }: Props) {
  const [circles, setCircles] = useState<MemoryCircle[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<MemoryCircle | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleDesc, setNewCircleDesc] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [newFriendId, setNewFriendId] = useState('');
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendEmail, setNewFriendEmail] = useState('');

  useEffect(() => {
    if (user?.uid) {
      loadCircles();
      loadFriends();
    }
  }, [user?.uid]);

  const loadCircles = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/memory-circles?user_id=${user!.uid}`);
      if (!res.ok) throw new Error('Failed to fetch circles');
      const data = await res.json();
      setCircles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load circles:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCircle = async () => {
    if (!newCircleName.trim() || !user?.uid) return;
    try {
      const res = await fetch('/api/memory-circles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCircleName.trim(),
          description: newCircleDesc.trim(),
          owner_id: user!.uid,
        }),
      });
      if (res.ok) {
        setNewCircleName('');
        setNewCircleDesc('');
        setShowCreateModal(false);
        await loadCircles();
      } else {
        console.error('Failed to create circle:', await res.text());
      }
    } catch (err) {
      console.error('Failed to create circle:', err);
    }
  };

  const loadCircleDetails = async (circleId: string) => {
    try {
      const res = await fetch(`/api/memory-circles/${circleId}`);
      if (!res.ok) throw new Error('Failed to fetch circle details');
      const data = await res.json();
      setSelectedCircle(data);
    } catch (err) {
      console.error('Failed to load circle details:', err);
    }
  };

  const addMember = async () => {
    if (!selectedCircle || !newMemberEmail.trim()) return;
    try {
      const res = await fetch(`/api/memory-circles/${selectedCircle.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: newMemberEmail.trim() }),
      });
      if (res.ok) {
        setNewMemberEmail('');
        await loadCircleDetails(selectedCircle.id);
      } else {
        console.error('Failed to add member:', await res.text());
      }
    } catch (err) {
      console.error('Failed to add member:', err);
    }
  };

  const shareJourney = async (journeyId: string) => {
    if (!selectedCircle || !user?.uid) return;
    try {
      const res = await fetch(`/api/memory-circles/${selectedCircle.id}/journeys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journey_id: journeyId,
          shared_by: user!.uid,
        }),
      });
      if (res.ok) {
        setShowShareModal(false);
        await loadCircleDetails(selectedCircle.id);
        alert('Journey shared successfully!');
      } else {
        console.error('Failed to share journey:', await res.text());
      }
    } catch (err) {
      console.error('Failed to share journey:', err);
    }
  };

  const loadFriends = async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`/api/friends?user_id=${user!.uid}`);
      if (!res.ok) throw new Error('Failed to fetch friends');
      const data = await res.json();
      setFriends(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load friends:', err);
    }
  };

  const addFriend = async () => {
    if (!newFriendId.trim() || !user?.uid) return;
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user!.uid,
          friend_id: newFriendId.trim(),
          friend_name: newFriendName.trim(),
          friend_email: newFriendEmail.trim(),
        }),
      });
      if (res.ok) {
        setNewFriendId('');
        setNewFriendName('');
        setNewFriendEmail('');
        setShowAddFriendModal(false);
        await loadFriends();
        alert('Friend added successfully!');
      } else {
        console.error('Failed to add friend:', await res.text());
      }
    } catch (err) {
      console.error('Failed to add friend:', err);
    }
  };

  const deleteFriend = async (friendId: string) => {
    if (!window.confirm('Remove this friend?')) return;
    try {
      const res = await fetch(`/api/friends/${friendId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadFriends();
      } else {
        console.error('Failed to delete friend:', await res.text());
      }
    } catch (err) {
      console.error('Failed to delete friend:', err);
    }
  };

  const inviteFriendToCircle = async (friendId: string) => {
    if (!selectedCircle) return;
    try {
      const res = await fetch(`/api/memory-circles/${selectedCircle.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: friendId }),
      });
      if (res.ok) {
        await loadCircleDetails(selectedCircle.id);
        alert('Friend invited to circle!');
      } else {
        console.error('Failed to invite friend:', await res.text());
      }
    } catch (err) {
      console.error('Failed to invite friend:', err);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Please Log In</h3>
          <p className="text-slate-400">You need to be logged in to access Memory Circles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Memory Circles
            </h1>
            <p className="text-slate-400">
              Private groups to share journeys with close friends
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFriendsModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Manage Friends ({friends.length})
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Circle
            </button>
          </div>
        </div>
      </div>

      {/* Loading / Empty */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className="text-slate-400 mt-4">Loading circles...</p>
        </div>
      ) : circles.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">No Memory Circles Yet</h3>
          <p className="text-slate-400 mb-6">
            Create your first circle to share journeys with friends
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
          >
            Create Your First Circle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {circles.map((circle) => (
            <div
              key={circle.id}
              onClick={() => loadCircleDetails(circle.id)}
              className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                  {circle.role}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{circle.name}</h3>
              <p className="text-slate-400 text-sm line-clamp-2 mb-4">{circle.description}</p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users className="w-4 h-4" />
                <span>Private circle</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Circle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create Memory Circle</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={newCircleName}
                onChange={(e) => setNewCircleName(e.target.value)}
                placeholder="e.g., Family Travels, College Friends"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={newCircleDesc}
                onChange={(e) => setNewCircleDesc(e.target.value)}
                placeholder="Describe your memory circle..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={createCircle}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 font-semibold"
              >
                Create Circle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Circle Details Modal */}
      {selectedCircle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[55] p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-8 my-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">{selectedCircle.name}</h2>
                <p className="text-slate-400">{selectedCircle.description}</p>
              </div>
              <button onClick={() => setSelectedCircle(null)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Members */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Members ({selectedCircle.members?.length || 0})
                  </h3>
                </div>
                <div className="space-y-2">
                  {selectedCircle.members?.map((m, i) => (
                    <div key={i} className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-300 text-sm">{m.user_id}</span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
                {selectedCircle.role === 'admin' && (
                  <div className="mt-4 space-y-2">
                    <input
                      type="text"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="User ID or Email"
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={addMember}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                    >
                      Add Member
                    </button>
                  </div>
                )}
              </div>

              {/* Shared Journeys */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Shared Journeys ({selectedCircle.journeys?.length || 0})
                  </h3>
                  <button onClick={() => setShowShareModal(true)} className="text-blue-400 hover:text-blue-300">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedCircle.journeys?.length ? (
                    selectedCircle.journeys.map((j) => (
                      <div key={j.id} className="p-3 bg-slate-900/50 rounded-lg">
                        <div className="font-medium text-white text-sm mb-1">{j.title}</div>
                        <div className="text-xs text-slate-500">Shared by: {j.shared_by}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Share2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No journeys shared yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Journey Modal */}
      {showShareModal && selectedCircle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-8 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Share Journey to Circle</h2>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3">
              {journeys.length ? (
                journeys.map((j) => (
                  <div
                    key={j.id}
                    onClick={() => shareJourney(j.id)}
                    className="p-4 bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-500 transition-all cursor-pointer"
                  >
                    <h3 className="font-bold text-white mb-2">{j.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2">{j.description}</p>
                    {j.legs.length > 0 && (
                      <div className="mt-2 text-xs text-slate-500">
                        {j.legs[0].fromCity} → {j.legs[j.legs.length - 1].toCity}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">No journeys available to share</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Friends Management Modal */}
      {showFriendsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-8 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Manage Friends</h2>
              <button onClick={() => setShowFriendsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <button
              onClick={() => setShowAddFriendModal(true)}
              className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Add New Friend
            </button>

            {friends.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No friends added yet. Add friends to easily invite them to circles!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="p-4 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-between hover:border-purple-500 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {friend.friend_name?.charAt(0) || friend.friend_id?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {friend.friend_name || friend.friend_id}
                        </div>
                        {friend.friend_email && (
                          <div className="text-xs text-slate-400">{friend.friend_email}</div>
                        )}
                        <div className="text-xs text-slate-500">ID: {friend.friend_id}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {selectedCircle && (
                        <button
                          onClick={() => inviteFriendToCircle(friend.friend_id)}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                          Invite to Circle
                        </button>
                      )}
                      <button
                        onClick={() => deleteFriend(friend.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Add Friend</h2>
              <button onClick={() => setShowAddFriendModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Friend's User ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newFriendId}
                  onChange={(e) => setNewFriendId(e.target.value)}
                  placeholder="Enter their Firebase UID"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Friend's Name</label>
                <input
                  type="text"
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Friend's Email</label>
                <input
                  type="email"
                  value={newFriendEmail}
                  onChange={(e) => setNewFriendEmail(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={addFriend}
                disabled={!newFriendId.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Add Friend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
