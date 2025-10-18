import { useState, useEffect } from 'react';
import { supabase, Journey, JourneyLeg } from '../lib/supabase';
import { User } from 'firebase/auth';

interface ProfileProps {
  firebaseUser: User;
  profileData: any; // from Supabase
  onProfileUpdate: (updatedData: any) => void;
}

type JourneyFormType = Partial<Journey> & { legs: JourneyLeg[] };

const Profile: React.FC<ProfileProps> = ({ firebaseUser, profileData, onProfileUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profileData?.name || '',
    email: profileData?.email || '',
    avatar_url: profileData?.avatar_url || '',
    bio: profileData?.bio || '',
  });
  const [loading, setLoading] = useState(false);
  const [userJourneys, setUserJourneys] = useState<Journey[]>([]);
  const [journeysLoading, setJourneysLoading] = useState(false);
  const [editingJourneyId, setEditingJourneyId] = useState<string | null>(null);
  const [journeyForm, setJourneyForm] = useState<JourneyFormType>({ legs: [] });

  useEffect(() => {
    if (firebaseUser) loadUserJourneys();
  }, [firebaseUser]);

  const loadUserJourneys = async () => {
    setJourneysLoading(true);
    try {
      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .eq('user_id', firebaseUser.uid)
        .order('created_at', { ascending: false });
      if (error) console.error(error);
      else setUserJourneys(data as Journey[]);
    } catch (err) {
      console.error(err);
    } finally {
      setJourneysLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .update(formData)
        .eq('id', firebaseUser.uid)
        .select()
        .single();

      if (error) throw error;
      onProfileUpdate(data);
      setEditing(false);
      alert('Profile updated!');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditJourney = (journey: Journey) => {
    setEditingJourneyId(journey.id);
    setJourneyForm({ ...journey, legs: journey.legs || [] });
  };

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
    setJourneyForm(prev => {
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
      return { ...prev, legs: [...(prev.legs || []), newLeg] };
    });
  };

  const handleRemoveLeg = (index: number) => {
    setJourneyForm(prev => {
      const updatedLegs = [...prev.legs];
      updatedLegs.splice(index, 1);
      return { ...prev, legs: updatedLegs };
    });
  };

  const handleSaveJourney = async () => {
    if (!editingJourneyId) return;
    try {
      const { data, error } = await supabase
        .from('journeys')
        .update(journeyForm)
        .eq('id', editingJourneyId)
        .select()
        .single();
      if (error) throw error;
      setUserJourneys(prev => prev.map(j => (j.id === editingJourneyId ? data : j)));
      setEditingJourneyId(null);
      alert('Journey saved!');
    } catch (err) {
      console.error(err);
      alert('Failed to save journey');
    }
  };

  const handleDeleteJourney = async (id: string) => {
    if (!confirm('Delete this journey?')) return;
    try {
      const { error } = await supabase.from('journeys').delete().eq('id', id);
      if (error) throw error;
      setUserJourneys(prev => prev.filter(j => j.id !== id));
      alert('Deleted!');
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    }
  };

  if (!profileData) return <p>Loading profile...</p>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
      {/* Profile Info */}
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg space-y-4">
        <div className="flex items-center gap-4">
          <img src={formData.avatar_url || 'https://via.placeholder.com/100'} className="w-24 h-24 rounded-full" />
          <div>
            <h2 className="text-white text-2xl font-bold">{formData.name}</h2>
            <p className="text-gray-400">{formData.email}</p>
          </div>
        </div>

        {editing ? (
          <div className="space-y-2">
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" />
            <input type="text" name="avatar_url" value={formData.avatar_url} onChange={handleChange} placeholder="Avatar URL" />
            <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Bio" />
            <button onClick={handleSaveProfile}>{loading ? 'Saving...' : 'Save Profile'}</button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}>Edit Profile</button>
        )}
      </div>

      {/* Journeys */}
      <div className="space-y-4">
        <h3 className="text-white text-xl font-bold">My Journeys</h3>
        {journeysLoading ? (
          <p>Loading journeys...</p>
        ) : userJourneys.length === 0 ? (
          <p className="text-gray-400">No journeys yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userJourneys.map(j => (
              <div key={j.id} className="bg-slate-700 p-4 rounded-lg">
                {editingJourneyId === j.id ? (
                  <div className="space-y-2">
                    <input type="text" name="title" value={journeyForm.title || ''} onChange={handleJourneyFormChange} placeholder="Title" />
                    <input type="text" name="journey_type" value={journeyForm.journey_type || ''} onChange={handleJourneyFormChange} placeholder="Type" />
                    <input type="date" name="departure_date" value={journeyForm.departure_date?.slice(0,10) || ''} onChange={handleJourneyFormChange} />
                    <input type="date" name="return_date" value={journeyForm.return_date?.slice(0,10) || ''} onChange={handleJourneyFormChange} />
                    <div>
                      {(journeyForm.legs || []).map((leg, idx) => (
                        <div key={idx} className="flex gap-1 items-center">
                          <input placeholder="From City" value={leg.fromCity} onChange={e => handleLegChange(idx, 'fromCity', e.target.value)} />
                          <input placeholder="From Country" value={leg.fromCountry} onChange={e => handleLegChange(idx, 'fromCountry', e.target.value)} />
                          <input placeholder="To City" value={leg.toCity} onChange={e => handleLegChange(idx, 'toCity', e.target.value)} />
                          <input placeholder="To Country" value={leg.toCountry} onChange={e => handleLegChange(idx, 'toCountry', e.target.value)} />
                          <button onClick={() => handleRemoveLeg(idx)}>Remove</button>
                        </div>
                      ))}
                      <button onClick={handleAddLeg}>Add Leg</button>
                    </div>
                    <button onClick={handleSaveJourney}>Save Journey</button>
                    <button onClick={() => setEditingJourneyId(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <h4 className="text-white font-semibold">{j.title}</h4>
                    <p className="text-gray-300">Type: {j.journey_type}</p>
                    <p className="text-gray-400">Departure: {j.departure_date} | Return: {j.return_date}</p>
                    {(j.legs || []).length > 0 && (
                      <ul className="text-gray-300 ml-4 list-disc">
                        {j.legs.map((leg, idx) => (
                          <li key={idx}>{leg.fromCity}, {leg.fromCountry} → {leg.toCity}, {leg.toCountry}</li>
                        ))}
                      </ul>
                    )}
                    <button onClick={() => handleEditJourney(j)}>Edit</button>
                    <button onClick={() => handleDeleteJourney(j.id)}>Delete</button>
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
