import { useState, useEffect } from 'react';
import { supabase, Journey, JourneyLeg } from '../lib/supabase';
import { User } from 'firebase/auth';

interface ProfileProps {
  firebaseUser: User;
  profileData: any;
  onProfileUpdate: (updatedData: any) => void;
}

type JourneyFormType = Partial<Journey> & { legs: JourneyLeg[] };

const Profile: React.FC<ProfileProps> = ({ firebaseUser, profileData, onProfileUpdate }) => {
  const [editingProfile, setEditingProfile] = useState(false);
  const [formData, setFormData] = useState({
    name: profileData?.name || '',
    email: profileData?.email || '',
    avatar_url: profileData?.avatar_url || '',
    bio: profileData?.bio || '',
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [userJourneys, setUserJourneys] = useState<Journey[]>([]);
  const [journeysLoading, setJourneysLoading] = useState(false);
  const [editingJourneyId, setEditingJourneyId] = useState<string | null>(null);
  const [journeyForm, setJourneyForm] = useState<JourneyFormType>({ legs: [] });

  // Load user journeys on mount
  useEffect(() => {
    if (firebaseUser) {
      loadUserJourneys();
      loadProfile();
    }
  }, [firebaseUser]);

  // Fetch journeys for this user (MariaDB API)
  const loadUserJourneys = async () => {
    setJourneysLoading(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(firebaseUser.uid)}/journeys`);
      if (!res.ok) throw new Error('Failed to load user journeys');
      const data = await res.json();
      setUserJourneys(data as Journey[]);
    } catch (err) {
      console.error('Unexpected error fetching journeys:', err);
    } finally {
      setJourneysLoading(false);
    }
  };

  // Fetch profile from Supabase
  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('firebase_uid', firebaseUser.uid)
        .single();

      if (!error && data) {
        onProfileUpdate(data);
        setFormData({
          name: data.name,
          email: data.email,
          avatar_url: data.avatar_url,
          bio: data.bio,
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadingAvatar(true);
      const folder = firebaseUser.uid;
      const path = `${folder}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = pub?.publicUrl;
      if (!publicUrl) throw new Error('No public URL');
      const { error: updErr } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('firebase_uid', firebaseUser.uid);
      if (updErr) throw updErr;
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      onProfileUpdate({ ...profileData, avatar_url: publicUrl });
      alert('✅ Profile picture updated');
    } catch (err) {
      console.error('Avatar upload failed:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`❌ Failed to upload avatar: ${msg}`);
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = '' as any;
    }
  };

  // Save profile (insert or update)
  const handleSaveProfile = async () => {
    setLoadingProfile(true);
    try {
      // Check if profile exists
      const { data: existingProfile, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('firebase_uid', firebaseUser.uid)
        .single();

      let updatedProfile;
      if (existingProfile) {
        // Update existing
        const { data, error } = await supabase
          .from('users')
          .update({
            name: formData.name,
            email: formData.email,
            avatar_url: formData.avatar_url,
            bio: formData.bio,
          })
          .eq('firebase_uid', firebaseUser.uid)
          .select()
          .single();

        if (error) throw error;
        updatedProfile = data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('users')
          .insert({
            firebase_uid: firebaseUser.uid,
            name: formData.name,
            email: formData.email,
            avatar_url: formData.avatar_url,
            bio: formData.bio,
          })
          .select()
          .single();

        if (error) throw error;
        updatedProfile = data;
      }

      // Fetch latest profile to ensure updates persist
      if (updatedProfile) {
        const { data: freshProfile } = await supabase
          .from('users')
          .select('*')
          .eq('firebase_uid', firebaseUser.uid)
          .single();

        if (freshProfile) {
          onProfileUpdate(freshProfile);
          setFormData({
            name: freshProfile.name,
            email: freshProfile.email,
            avatar_url: freshProfile.avatar_url,
            bio: freshProfile.bio,
          });
        }
      }

      setEditingProfile(false);
      alert('✅ Profile saved successfully!');
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('❌ Failed to save profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  // Journey form handlers
  const handleJourneyFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJourneyForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLegChange = (index: number, field: keyof JourneyLeg, value: string) => {
    setJourneyForm(prev => {
      const updatedLegs = [...prev.legs];
      updatedLegs[index] = { ...updatedLegs[index], [field]: value };
      return { ...prev, legs: updatedLegs };
    });
  };

  const handleAddLeg = () => {
    const newLeg: JourneyLeg = {
      from: '',
      to: '',
      fromCity: '',
      toCity: '',
      fromCountry: '',
      toCountry: '',
      date: '',
      distance: 0,
    };
    setJourneyForm(prev => ({ ...prev, legs: [...(prev.legs || []), newLeg] }));
  };

  const handleRemoveLeg = (index: number) => {
    setJourneyForm(prev => {
      const updatedLegs = [...prev.legs];
      updatedLegs.splice(index, 1);
      return { ...prev, legs: updatedLegs };
    });
  };

  // Save journey (MariaDB API)
  const handleSaveJourney = async () => {
    try {
      const payload: Partial<Journey> = {
        ...journeyForm,
        user_id: firebaseUser.uid,
        legs: (journeyForm.legs || []) as JourneyLeg[],
        title: journeyForm.title || 'Untitled Journey',
        journey_type: (journeyForm.journey_type as any) || 'solo',
        departure_date: journeyForm.departure_date || new Date().toISOString().slice(0,10),
        return_date: journeyForm.return_date || journeyForm.departure_date || new Date().toISOString().slice(0,10),
        visibility: (journeyForm.visibility as any) || 'public',
      };

      if (editingJourneyId) {
        const res = await fetch(`/api/journeys/${encodeURIComponent(editingJourneyId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Update failed');
        const data = await res.json();
        setUserJourneys(prev => prev.map(j => (j.id === editingJourneyId ? (data as Journey) : j)));
      } else {
        const res = await fetch('/api/journeys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Create failed');
        const data = await res.json();
        setUserJourneys(prev => [data as Journey, ...prev]);
      }

      setEditingJourneyId(null);
      setJourneyForm({ legs: [] });
      alert('✅ Journey saved!');
    } catch (err) {
      console.error(err);
      alert('❌ Failed to save journey');
    }
  };

  const handleDeleteJourney = async (id: string) => {
    if (!confirm('Are you sure you want to delete this journey?')) return;
    try {
      const res = await fetch(`/api/journeys/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.status !== 204 && res.status !== 200) throw new Error('Delete failed');
      setUserJourneys(prev => prev.filter(j => j.id !== id));
      alert('🗑 Journey deleted!');
    } catch (err) {
      console.error(err);
      alert('❌ Failed to delete journey');
    }
  };

  if (!profileData) return <p className="text-white text-center mt-12">Loading profile...</p>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
      {/* PROFILE SECTION */}
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg space-y-4">
        <div className="flex items-center gap-6">
          <img
            src={formData.avatar_url || 'https://via.placeholder.com/120'}
            className="w-28 h-28 rounded-full border-4 border-purple-400 shadow-md"
          />
          <div>
            <h2 className="text-white text-3xl font-bold">{formData.name}</h2>
            <p className="text-purple-300">{formData.email}</p>
            <p className="text-gray-400 mt-1">{formData.bio || 'No bio added yet.'}</p>
          </div>
        </div>

        {editingProfile ? (
          <div className="space-y-2 mt-4">
            <input
              type="text"
              name="name"
              className="w-full p-2 rounded bg-slate-700 text-white"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
            />
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                className="text-sm text-gray-200 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
              />
              {uploadingAvatar && <span className="text-gray-300">Uploading...</span>}
            </div>
            <input
              type="text"
              name="avatar_url"
              className="w-full p-2 rounded bg-slate-700 text-white"
              placeholder="Avatar URL"
              value={formData.avatar_url}
              onChange={handleChange}
            />
            <textarea
              name="bio"
              className="w-full p-2 rounded bg-slate-700 text-white"
              placeholder="Bio"
              value={formData.bio}
              onChange={handleChange}
            />
            <div className="flex gap-3">
              <button
                onClick={handleSaveProfile}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md"
              >
                {loadingProfile ? 'Saving...' : 'Save Profile'}
              </button>
              <button
                onClick={() => setEditingProfile(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingProfile(true)}
            className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* JOURNEYS SECTION */}
      <div className="space-y-4">
        <h3 className="text-white text-2xl font-semibold">My Journeys</h3>
        {journeysLoading ? (
          <p className="text-gray-400">Loading journeys...</p>
        ) : userJourneys.length === 0 ? (
          <p className="text-gray-400">No journeys yet. Add one below!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userJourneys.map(j => (
              <div key={j.id} className="bg-slate-700 p-4 rounded-lg shadow-lg">
                {editingJourneyId === j.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="title"
                      placeholder="Title"
                      className="w-full p-2 bg-slate-600 rounded text-white"
                      value={journeyForm.title || ''}
                      onChange={handleJourneyFormChange}
                    />
                    <input
                      type="text"
                      name="journey_type"
                      placeholder="Type"
                      className="w-full p-2 bg-slate-600 rounded text-white"
                      value={journeyForm.journey_type || ''}
                      onChange={handleJourneyFormChange}
                    />
                    <div className="flex gap-2">
                      <input
                        type="date"
                        name="departure_date"
                        className="w-full p-2 bg-slate-600 rounded text-white"
                        value={journeyForm.departure_date?.slice(0, 10) || ''}
                        onChange={handleJourneyFormChange}
                      />
                      <input
                        type="date"
                        name="return_date"
                        className="w-full p-2 bg-slate-600 rounded text-white"
                        value={journeyForm.return_date?.slice(0, 10) || ''}
                        onChange={handleJourneyFormChange}
                      />
                    </div>
                    <div>
                      {(journeyForm.legs || []).map((leg, idx) => (
                        <div key={idx} className="flex gap-1 items-center mb-1">
                          <input
                            placeholder="From City"
                            className="p-1 bg-slate-600 rounded text-white"
                            value={leg.fromCity}
                            onChange={e => handleLegChange(idx, 'fromCity', e.target.value)}
                          />
                          <input
                            placeholder="To City"
                            className="p-1 bg-slate-600 rounded text-white"
                            value={leg.toCity}
                            onChange={e => handleLegChange(idx, 'toCity', e.target.value)}
                          />
                          <button
                            onClick={() => handleRemoveLeg(idx)}
                            className="bg-red-500 px-2 py-1 rounded text-white"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={handleAddLeg}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded"
                      >
                        + Add Leg
                      </button>
                    </div>
                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={handleSaveJourney}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 text-white rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingJourneyId(null)}
                        className="bg-gray-600 hover:bg-gray-700 px-4 py-2 text-white rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="text-white text-lg font-semibold">{j.title}</h4>
                    <p className="text-gray-300">Type: {j.journey_type}</p>
                    <p className="text-gray-400 text-sm">
                      {j.departure_date} → {j.return_date}
                    </p>
                    {(j.legs || []).length > 0 && (
                      <ul className="text-gray-300 list-disc ml-4">
                        {j.legs.map((leg, idx) => (
                          <li key={idx}>
                            {leg.fromCity} → {leg.toCity}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={() => {
                          setEditingJourneyId(j.id);
                          setJourneyForm(j);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteJourney(j.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;