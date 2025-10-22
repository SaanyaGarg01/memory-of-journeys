// Future Memory Planner - AI-powered trip suggestions
import { useEffect, useMemo, useState } from 'react';
import { Compass, Sparkles, MapPin, Calendar, Trash2, Save } from 'lucide-react';

interface TripSuggestion {
  destination: string;
  reason: string;
  matchScore: number;
  bestTime: string;
  highlights: string[];
}

type Plan = {
  id: string;
  user_id: string;
  destination: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

interface FutureMemoryPlannerProps {
  travelPreferences: {
    explorer: number;
    wanderer: number;
    seeker: number;
    relaxer: number;
  };
  userId?: string;
}

export default function FutureMemoryPlanner({ travelPreferences, userId }: FutureMemoryPlannerProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Partial<Plan>>>({});

  useEffect(() => {
    if (!userId) return;
    void loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadPlans = async () => {
    if (!userId) return;
    setLoadingPlans(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}/plans`);
      if (res.ok) {
        const data: Plan[] = await res.json();
        setPlans(data);
      }
    } finally {
      setLoadingPlans(false);
    }
  };

  const planFromSuggestion = (s: TripSuggestion): Partial<Plan> => ({
    user_id: userId!,
    destination: s.destination,
    reason: s.reason,
    notes: `Highlights: ${s.highlights.join(', ')}`
  });

  const handleCreate = async (base: Partial<Plan>) => {
    if (!userId) return alert('Please sign in to save plans');
    try {
      setSaving(true);
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(base)
      });
      if (!res.ok) {
        const txt = await res.text().catch(()=> '');
        throw new Error(`Create failed (${res.status}): ${txt}`);
      }
      await loadPlans();
    } catch (e:any) {
      alert(e?.message || 'Failed to create plan');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      setSaving(true);
      const patch = drafts[id] || {};
      const res = await fetch(`/api/plans/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      if (!res.ok) {
        const txt = await res.text().catch(()=> '');
        throw new Error(`Update failed (${res.status}): ${txt}`);
      }
      setDrafts(prev => { const cp = { ...prev }; delete cp[id]; return cp; });
      await loadPlans();
    } catch (e:any) {
      alert(e?.message || 'Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    try {
      const res = await fetch(`/api/plans/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.status === 204 || res.status === 200) await loadPlans();
    } catch {
      alert('Failed to delete plan');
    }
  };

  // Adaptive suggestions based on preferences and excluding already planned destinations
  const suggestions = useMemo<TripSuggestion[]>(() => {
    const planned = new Set((plans || []).map((p: Plan) => (p.destination || '').toLowerCase()));
    const base = generateSuggestions(travelPreferences);
    const unique: TripSuggestion[] = [];
    for (const s of base) {
      if (!planned.has(s.destination.toLowerCase()) && !unique.find(u => u.destination.toLowerCase() === s.destination.toLowerCase())) {
        unique.push(s);
      }
    }
    const dominant = Object.entries(travelPreferences).sort((a,b)=>Number(b[1])-Number(a[1]))[0]?.[0] || 'explorer';
    const fallbacks: Record<string, TripSuggestion[]> = {
      explorer: [
        { destination: 'Patagonia, Argentina', reason: 'Epic trails, glaciers, and wild landscapes for true explorers.', matchScore: 86, bestTime: 'Nov–Mar', highlights: ['Torres del Paine', 'Glaciers', 'Trekking'] },
        { destination: 'New Zealand South Island', reason: 'Adventure capital with fjords, peaks, and pristine lakes.', matchScore: 84, bestTime: 'Nov–Apr', highlights: ['Milford Sound', 'Hikes', 'Roadtrips'] }
      ],
      seeker: [
        { destination: 'Varanasi, India', reason: 'Spiritual heart with ghats, rituals, and timeless culture.', matchScore: 83, bestTime: 'Oct–Mar', highlights: ['Ganga Aarti', 'Temples', 'Ghat Walks'] },
        { destination: 'Luang Prabang, Laos', reason: 'Quiet temples and mindful river life.', matchScore: 80, bestTime: 'Nov–Mar', highlights: ['Alms Giving', 'Waterfalls', 'Old Town'] }
      ],
      relaxer: [
        { destination: 'Bali, Indonesia', reason: 'Calm beaches, rice terraces, and spa retreats.', matchScore: 82, bestTime: 'Apr–Oct', highlights: ['Ubud', 'Beaches', 'Wellness'] },
        { destination: 'Phuket, Thailand', reason: 'Tropical shores and island hopping to unwind.', matchScore: 80, bestTime: 'Nov–Apr', highlights: ['Phi Phi', 'Beaches', 'Thai Spa'] }
      ],
      wanderer: [
        { destination: 'Barcelona, Spain', reason: 'Art, architecture, and vibrant city wandering.', matchScore: 85, bestTime: 'Apr–Jun, Sep–Oct', highlights: ['Gaudí', 'Gothic Quarter', 'Tapas'] },
        { destination: 'Seoul, South Korea', reason: 'Trendy districts and culture-rich neighborhoods.', matchScore: 82, bestTime: 'Apr–Jun, Sep–Oct', highlights: ['Palaces', 'Markets', 'Cafés'] }
      ]
    };
    let i = 0;
    while (unique.length < 3 && i < (fallbacks[dominant]?.length || 0)) {
      const f = fallbacks[dominant]![i++];
      if (!planned.has(f.destination.toLowerCase()) && !unique.find(u => u.destination.toLowerCase() === f.destination.toLowerCase())) {
        unique.push(f);
      }
    }
    return unique.slice(0, 3);
  }, [plans, travelPreferences]);

  return (
    <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 backdrop-blur-sm rounded-2xl p-6 border border-emerald-700/50">
      <div className="flex items-center gap-3 mb-6">
        <Compass className="w-6 h-6 text-emerald-400" />
        <h3 className="text-2xl font-bold text-white">Future Memory Planner</h3>
        <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
      </div>

      <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
        <p className="text-slate-300 text-sm">
          Based on your travel patterns and preferences, here are destinations perfectly matched for you:
        </p>
      </div>

      <div className="space-y-4">
        {suggestions.map((suggestion: TripSuggestion, index: number) => (
          <div key={`${suggestion.destination}-${index}`} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-emerald-500/50 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-lg font-bold text-white">{suggestion.destination}</h4>
                </div>
                <p className="text-sm text-slate-400 mt-1">{suggestion.reason}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-400">{suggestion.matchScore}%</div>
                <div className="text-xs text-slate-400">Match</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-300 mb-3">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Best time: {suggestion.bestTime}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestion.highlights.map((highlight: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs"
                >
                  {highlight}
                </span>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
              {(() => {
                const skey = `s_${index}_${suggestion.destination.toLowerCase()}`;
                return (
                  <>
                    <input type="date" onChange={(e)=> setDrafts(prev=>({ ...prev, [skey]: { ...(prev[skey]||planFromSuggestion(suggestion)), start_date: e.target.value } }))} className="px-2 py-2 rounded bg-slate-800 text-white border border-slate-700" />
                    <input type="date" onChange={(e)=> setDrafts(prev=>({ ...prev, [skey]: { ...(prev[skey]||planFromSuggestion(suggestion)), end_date: e.target.value } }))} className="px-2 py-2 rounded bg-slate-800 text-white border border-slate-700" />
                    <input placeholder="Notes (optional)" onChange={(e)=> setDrafts(prev=>({ ...prev, [skey]: { ...(prev[skey]||planFromSuggestion(suggestion)), notes: e.target.value } }))} className="px-3 py-2 rounded bg-slate-800 text-white border border-slate-700 md:col-span-2" />
                    <button disabled={saving} onClick={()=> handleCreate(drafts[skey] || planFromSuggestion(suggestion))} className="py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Plan'}</button>
                  </>
                );
              })()}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <h4 className="text-xl font-bold text-white">Your Saved Plans</h4>
          {loadingPlans && <span className="text-slate-400 text-sm">Loading...</span>}
        </div>
        {plans.length === 0 ? (
          <div className="text-slate-400 text-sm">No plans yet. Save one from the suggestions above.</div>
        ) : (
          <div className="space-y-3">
            {plans.map((p: Plan) => (
              <div key={p.id} className="p-3 rounded-lg border border-white/10 bg-white/5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold">{p.destination}</div>
                    <div className="text-slate-400 text-xs">{p.reason}</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 flex-1 md:ml-6">
                    <input type="date" defaultValue={p.start_date || ''} onChange={(e)=> setDrafts(prev=>({ ...prev, [p.id]: { ...(prev[p.id]||{}), start_date: e.target.value } }))} className="px-2 py-2 rounded bg-slate-800 text-white border border-slate-700" />
                    <input type="date" defaultValue={p.end_date || ''} onChange={(e)=> setDrafts(prev=>({ ...prev, [p.id]: { ...(prev[p.id]||{}), end_date: e.target.value } }))} className="px-2 py-2 rounded bg-slate-800 text-white border border-slate-700" />
                    <input defaultValue={p.notes || ''} placeholder="Notes" onChange={(e)=> setDrafts(prev=>({ ...prev, [p.id]: { ...(prev[p.id]||{}), notes: e.target.value } }))} className="px-2 py-2 rounded bg-slate-800 text-white border border-slate-700 col-span-2 md:col-span-2" />
                    <div className="flex items-center gap-2">
                      <button disabled={saving} onClick={()=> handleUpdate(p.id)} className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm flex items-center gap-1"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save'}</button>
                      <button onClick={()=> handleDelete(p.id)} className="px-3 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm flex items-center gap-1"><Trash2 className="w-4 h-4" />Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-sm text-slate-400">✨ Predictions improve as you add more journeys</div>
    </div>
  );
}

function generateSuggestions(preferences: any): TripSuggestion[] {
  const suggestions: TripSuggestion[] = [];

  if (preferences.explorer > 40) {
    suggestions.push({
      destination: 'Bhutan - Land of Thunder Dragon',
      reason: 'Your adventurous spirit would thrive in the Himalayan trails and ancient monasteries.',
      matchScore: 92,
      bestTime: 'March-May, Sep-Nov',
      highlights: ['Mountain Treks', 'Buddhist Culture', 'Pristine Nature']
    });
  }

  if (preferences.seeker > 30) {
    suggestions.push({
      destination: 'Kyoto, Japan',
      reason: 'Perfect for seekers - blend of zen temples, tradition, and mindfulness.',
      matchScore: 88,
      bestTime: 'March-April (Cherry Blossoms)',
      highlights: ['Temples', 'Tea Ceremonies', 'Meditation']
    });
  }

  if (preferences.relaxer > 35) {
    suggestions.push({
      destination: 'Maldives',
      reason: 'Ultimate relaxation in overwater bungalows with crystal clear waters.',
      matchScore: 85,
      bestTime: 'November-April',
      highlights: ['Beach Paradise', 'Water Villas', 'Diving']
    });
  }

  if (preferences.wanderer > 40) {
    suggestions.push({
      destination: 'Tokyo, Japan',
      reason: 'Urban explorer\'s dream - neon lights, culture, and endless discovery.',
      matchScore: 90,
      bestTime: 'October-November',
      highlights: ['City Life', 'Food Culture', 'Modern & Traditional']
    });
  }

  return suggestions;
}
