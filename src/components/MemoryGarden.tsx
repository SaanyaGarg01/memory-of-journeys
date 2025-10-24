import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Flower2, Droplet, Sparkles } from 'lucide-react';

interface Plant {
  id: string;
  user_id: string;
  journey_id: string | null;
  plant_type: string;
  plant_name: string;
  growth_stage: number;
  planted_at: string;
  last_watered: string;
  position_x: number;
  position_y: number;
  color: string;
}

interface Props {
  user: User | null;
}

export default function MemoryGarden({ user }: Props) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [watering, setWatering] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadGarden();
    }
  }, [user?.uid]);

  const loadGarden = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/garden/${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setPlants(data);
      }
    } catch (error) {
      console.error('Error loading garden:', error);
    } finally {
      setLoading(false);
    }
  };

  const waterPlant = async (plantId: string) => {
    setWatering(true);
    try {
      const res = await fetch(`/api/garden/water/${plantId}`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setPlants(prev => prev.map(p => 
          p.id === plantId ? { ...p, growth_stage: updated.growth_stage, last_watered: updated.last_watered } : p
        ));
        setSelectedPlant(prev => prev && prev.id === plantId ? { ...prev, growth_stage: updated.growth_stage } : prev);
      }
    } catch (error) {
      console.error('Error watering plant:', error);
    } finally {
      setWatering(false);
    }
  };

  const getPlantEmoji = (plantType: string, growthStage: number) => {
    const stages = {
      rose: ['🌱', '🌿', '🥀', '🌹', '🌺'],
      tulip: ['🌱', '🌿', '🌷', '🌷', '🌷'],
      sunflower: ['🌱', '🌿', '🌻', '🌻', '🌻'],
      lotus: ['🌱', '🌿', '🪷', '🪷', '🪷'],
      orchid: ['🌱', '🌿', '🌸', '🌸', '🌸'],
      lily: ['🌱', '🌿', '🌺', '🌺', '🌺'],
      daisy: ['🌱', '🌿', '🌼', '🌼', '🌼'],
      cherry_blossom: ['🌱', '🌿', '🌸', '🌸', '🌸']
    };
    
    const emojis = stages[plantType as keyof typeof stages] || ['🌱', '🌿', '🌼', '🌼', '🌼'];
    return emojis[Math.min(growthStage - 1, 4)] || '🌱';
  };

  if (!user) {
    return (
      <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800 text-center">
        <Flower2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Please Log In</h3>
        <p className="text-slate-400">You need to be logged in to view your memory garden</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4" />
          <p className="text-slate-400">Loading your garden...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: plants.length,
    fullyGrown: plants.filter(p => p.growth_stage >= 5).length,
    growing: plants.filter(p => p.growth_stage < 5).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 backdrop-blur-sm rounded-2xl p-6 border border-green-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">🌸 Your Memory Garden</h2>
            <p className="text-slate-300">Each journey plants a symbolic flower that grows over time</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{stats.total}</div>
              <div className="text-sm text-slate-400">Total Plants</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">{stats.fullyGrown}</div>
              <div className="text-sm text-slate-400">Fully Grown</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{stats.growing}</div>
              <div className="text-sm text-slate-400">Growing</div>
            </div>
          </div>
        </div>
      </div>

      {plants.length === 0 ? (
        <div className="bg-slate-900/50 rounded-2xl p-12 border border-slate-800 text-center">
          <div className="text-6xl mb-4">🌱</div>
          <h3 className="text-2xl font-bold text-white mb-2">Your Garden is Empty</h3>
          <p className="text-slate-400 mb-6">Create your first journey to plant a flower!</p>
          <div className="text-sm text-slate-500">
            Each journey you create automatically plants a symbolic flower in your garden
          </div>
        </div>
      ) : (
        <>
          {/* Garden Canvas */}
          <div className="bg-gradient-to-b from-green-900/20 to-emerald-950/40 rounded-2xl p-8 border border-green-800/30 relative min-h-[600px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(34,197,94,0.1),transparent)]" />
            
            {/* Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-green-950/50 to-transparent rounded-b-2xl" />
            
            {/* Plants */}
            <div className="relative">
              {plants.map((plant) => (
                <div
                  key={plant.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110"
                  style={{
                    left: `${plant.position_x}px`,
                    top: `${plant.position_y}px`
                  }}
                  onClick={() => setSelectedPlant(plant)}
                >
                  <div className="text-6xl drop-shadow-lg">{getPlantEmoji(plant.plant_type, plant.growth_stage)}</div>
                  {plant.growth_stage >= 5 && (
                    <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
                  )}
                </div>
              ))}
            </div>

            {plants.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-slate-600 text-lg">Plant your first flower by creating a journey!</p>
              </div>
            )}
          </div>

          {/* Plant Details Panel */}
          {selectedPlant && (
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-5xl mb-2">{getPlantEmoji(selectedPlant.plant_type, selectedPlant.growth_stage)}</div>
                  <h3 className="text-2xl font-bold text-white mb-1">{selectedPlant.plant_name}</h3>
                  <p className="text-slate-400 capitalize">{selectedPlant.plant_type.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={() => setSelectedPlant(null)}
                  className="text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-500">Growth Stage</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((stage) => (
                      <div
                        key={stage}
                        className={`h-2 flex-1 rounded ${
                          stage <= selectedPlant.growth_stage ? 'bg-green-500' : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedPlant.growth_stage >= 5 ? 'Fully Grown!' : `${selectedPlant.growth_stage}/5`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Planted</p>
                  <p className="text-white">{new Date(selectedPlant.planted_at).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedPlant.growth_stage < 5 && (
                <button
                  onClick={() => waterPlant(selectedPlant.id)}
                  disabled={watering}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
                >
                  <Droplet className="w-5 h-5" />
                  {watering ? 'Watering...' : 'Water Plant'}
                </button>
              )}

              {selectedPlant.growth_stage >= 5 && (
                <div className="bg-green-900/30 rounded-lg p-4 border border-green-700/50 text-center">
                  <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-green-300 font-semibold">This plant is fully grown!</p>
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-4">🌿 How It Works</h3>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <div>
                  <strong>Auto-Plant:</strong> A random flower is planted automatically when you create a journey
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400">💧</span>
                <div>
                  <strong>Water to Grow:</strong> Click on a plant to select it, then water it to increase its growth stage
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400">✨</span>
                <div>
                  <strong>Full Bloom:</strong> Plants reach full growth at stage 5, displaying beautiful blooms
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400">🌸</span>
                <div>
                  <strong>Collect Memories:</strong> Each flower represents a journey you've taken
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
