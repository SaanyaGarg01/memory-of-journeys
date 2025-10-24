import { useState, useEffect } from 'react';
import { BookOpen, Plus, X, Send, Users, MapPin } from 'lucide-react';
import { User } from 'firebase/auth';

interface CollaborativeJournal {
  id: string;
  title: string;
  description: string;
  created_by: string;
  role: string;
  created_at: string;
  updated_at: string;
  members?: Array<{ user_id: string; user_name: string; role: string }>;
  entries?: Array<{
    id: string;
    user_id: string;
    user_name: string;
    content: string;
    entry_type: string;
    image_url?: string;
    location?: string;
    created_at: string;
  }>;
}

interface Props {
  user: User | null;
}

export default function CollaborativeJournal({ user }: Props) {
  const [journals, setJournals] = useState<CollaborativeJournal[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<CollaborativeJournal | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newJournalTitle, setNewJournalTitle] = useState('');
  const [newJournalDesc, setNewJournalDesc] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryLocation, setNewEntryLocation] = useState('');
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberUserName, setNewMemberUserName] = useState('');

  useEffect(() => {
    if (user?.uid) loadJournals();
  }, [user?.uid]);

  const loadJournals = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/collaborative-journals?user_id=${user!.uid}`);
      const data = await res.json();
      setJournals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load journals:', err);
    } finally {
      setLoading(false);
    }
  };

  const createJournal = async () => {
    if (!newJournalTitle.trim() || !user?.uid) return;
    try {
      const res = await fetch('/api/collaborative-journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newJournalTitle,
          description: newJournalDesc,
          created_by: user!.uid,
          members: []
        })
      });
      if (res.ok) {
        setNewJournalTitle('');
        setNewJournalDesc('');
        setShowCreateModal(false);
        await loadJournals();
      }
    } catch (err) {
      console.error('Failed to create journal:', err);
    }
  };

  const loadJournalDetails = async (journalId: string) => {
    try {
      const res = await fetch(`/api/collaborative-journals/${journalId}`);
      const data = await res.json();
      setSelectedJournal(data);
    } catch (err) {
      console.error('Failed to load journal details:', err);
    }
  };

  const addEntry = async () => {
    if (!selectedJournal || !newEntryContent.trim() || !user?.uid) return;
    try {
      const res = await fetch(`/api/collaborative-journals/${selectedJournal.id}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user!.uid,
          user_name: user.displayName || 'Anonymous',
          content: newEntryContent,
          entry_type: 'text',
          location: newEntryLocation
        })
      });
      if (res.ok) {
        setNewEntryContent('');
        setNewEntryLocation('');
        await loadJournalDetails(selectedJournal.id);
      }
    } catch (err) {
      console.error('Failed to add entry:', err);
    }
  };

  const addMember = async () => {
    if (!selectedJournal || !newMemberUserId.trim()) return;
    try {
      const res = await fetch(`/api/collaborative-journals/${selectedJournal.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: newMemberUserId,
          user_name: newMemberUserName
        })
      });
      if (res.ok) {
        setNewMemberUserId('');
        setNewMemberUserName('');
        await loadJournalDetails(selectedJournal.id);
      }
    } catch (err) {
      console.error('Failed to add member:', err);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
          <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Please Log In</h3>
          <p className="text-slate-400">You need to be logged in to access Collaborative Journals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Collaborative Travel Journals
            </h1>
            <p className="text-slate-400">Co-write travel stories with friends, family, or groups</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Journal
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          <p className="text-slate-400 mt-4">Loading journals...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {journals.map((journal) => (
            <div
              key={journal.id}
              className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 hover:border-purple-500 transition-all cursor-pointer"
              onClick={() => loadJournalDetails(journal.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                  {journal.role}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{journal.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-2 mb-4">{journal.description}</p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Updated {new Date(journal.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {journals.length === 0 && !loading && (
        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
          <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">No Journals Yet</h3>
          <p className="text-slate-400 mb-6">Create a collaborative journal to document trips with others</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Create Your First Journal
          </button>
        </div>
      )}

      {/* Create Journal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create Collaborative Journal</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Journal Title</label>
                <input
                  type="text"
                  value={newJournalTitle}
                  onChange={(e) => setNewJournalTitle(e.target.value)}
                  placeholder="e.g., Europe Trip 2024, Family Vacation"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={newJournalDesc}
                  onChange={(e) => setNewJournalDesc(e.target.value)}
                  placeholder="Describe your journey..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={createJournal}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-semibold"
              >
                Create Journal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Journal Details Modal */}
      {selectedJournal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full p-8 my-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">{selectedJournal.title}</h2>
                <p className="text-slate-400">{selectedJournal.description}</p>
              </div>
              <button onClick={() => setSelectedJournal(null)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Journal Entries - Main Column */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Journal Entries
                  </h3>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4">
                    {selectedJournal.entries?.map((entry) => (
                      <div key={entry.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {entry.user_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="font-medium text-white text-sm">{entry.user_name}</div>
                              <div className="text-xs text-slate-500">
                                {new Date(entry.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          {entry.location && (
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <MapPin className="w-3 h-3" />
                              {entry.location}
                            </div>
                          )}
                        </div>
                        <p className="text-slate-300 whitespace-pre-wrap">{entry.content}</p>
                        {entry.image_url && (
                          <img
                            src={entry.image_url}
                            alt="Entry"
                            className="mt-3 rounded-lg max-h-64 object-cover"
                          />
                        )}
                      </div>
                    ))}
                    {(!selectedJournal.entries || selectedJournal.entries.length === 0) && (
                      <div className="text-center py-12 text-slate-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No entries yet. Be the first to write!</p>
                      </div>
                    )}
                  </div>

                  {/* Add Entry Form */}
                  <div className="border-t border-slate-700 pt-4 space-y-3">
                    <textarea
                      value={newEntryContent}
                      onChange={(e) => setNewEntryContent(e.target.value)}
                      placeholder="Share your experience..."
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newEntryLocation}
                        onChange={(e) => setNewEntryLocation(e.target.value)}
                        placeholder="Location (optional)"
                        className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={addEntry}
                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Members Sidebar */}
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Contributors ({selectedJournal.members?.length || 0})
                  </h3>
                  <div className="space-y-2 mb-4">
                    {selectedJournal.members?.map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {member.user_name?.charAt(0) || member.user_id?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {member.user_name || member.user_id}
                            </div>
                            <div className="text-xs text-slate-500">{member.role}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedJournal.role === 'admin' && (
                    <div className="border-t border-slate-700 pt-4 space-y-2">
                      <input
                        type="text"
                        value={newMemberUserId}
                        onChange={(e) => setNewMemberUserId(e.target.value)}
                        placeholder="User ID"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="text"
                        value={newMemberUserName}
                        onChange={(e) => setNewMemberUserName(e.target.value)}
                        placeholder="Name (optional)"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={addMember}
                        className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm font-medium"
                      >
                        Add Member
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
