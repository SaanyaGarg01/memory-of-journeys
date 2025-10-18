// Memory Temperature Feature - Warm vs Cold Memories
import { Thermometer, Flame, Snowflake } from 'lucide-react';
import { analyzeTextMood } from '../utils/sentimentClient';

interface Journey {
  id: string;
  title: string;
  description: string;
  departure_date: string;
  legs: Array<{ from: string; to: string }>;
}

interface MemoryTemperature {
  id: string;
  title: string;
  temperature: number; // 0-100
  sentiment: number; // -1 to 1
  category: 'frozen' | 'cold' | 'cool' | 'warm' | 'hot';
  color: string;
  icon: JSX.Element;
}

interface MemoryTemperatureProps {
  journeys: Journey[];
}

export default function MemoryTemperature({ journeys }: MemoryTemperatureProps) {
  const calculateTemperature = (journey: Journey): MemoryTemperature => {
    // Analyze sentiment
    const moodResult = analyzeTextMood(journey.description || journey.title);
    
    // Temperature is based on comparative score (typically -1 to 1, mapped to 0 to 100)
    // We use comparative score which is normalized by word count
    const temperature = Math.max(0, Math.min(100, ((moodResult.comparative + 1) / 2) * 100));
    
    // Categorize
    let category: MemoryTemperature['category'];
    let color: string;
    let icon: JSX.Element;
    
    if (temperature < 20) {
      category = 'frozen';
      color = 'from-blue-900 to-blue-700';
      icon = <Snowflake className="w-6 h-6" />;
    } else if (temperature < 40) {
      category = 'cold';
      color = 'from-cyan-600 to-blue-500';
      icon = <Snowflake className="w-6 h-6" />;
    } else if (temperature < 60) {
      category = 'cool';
      color = 'from-green-500 to-teal-500';
      icon = <Thermometer className="w-6 h-6" />;
    } else if (temperature < 80) {
      category = 'warm';
      color = 'from-orange-500 to-amber-500';
      icon = <Flame className="w-6 h-6" />;
    } else {
      category = 'hot';
      color = 'from-red-600 to-orange-500';
      icon = <Flame className="w-6 h-6" />;
    }
    
    return {
      id: journey.id,
      title: journey.title,
      temperature,
      sentiment: moodResult.comparative,
      category,
      color,
      icon
    };
  };

  const memoryTemperatures = journeys.map(calculateTemperature).sort((a, b) => b.temperature - a.temperature);

  const getCategoryEmoji = (category: MemoryTemperature['category']) => {
    switch (category) {
      case 'frozen': return '🥶';
      case 'cold': return '❄️';
      case 'cool': return '😌';
      case 'warm': return '☀️';
      case 'hot': return '🔥';
    }
  };

  const getCategoryDescription = (category: MemoryTemperature['category']) => {
    switch (category) {
      case 'frozen': return 'Challenging or difficult experiences';
      case 'cold': return 'Calm and peaceful moments';
      case 'cool': return 'Balanced, neutral experiences';
      case 'warm': return 'Pleasant and enjoyable memories';
      case 'hot': return 'Exciting, passionate adventures';
    }
  };

  const stats = {
    frozen: memoryTemperatures.filter(m => m.category === 'frozen').length,
    cold: memoryTemperatures.filter(m => m.category === 'cold').length,
    cool: memoryTemperatures.filter(m => m.category === 'cool').length,
    warm: memoryTemperatures.filter(m => m.category === 'warm').length,
    hot: memoryTemperatures.filter(m => m.category === 'hot').length,
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
          <Thermometer className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Memory Temperature</h2>
          <p className="text-slate-400 text-sm">Visualize warm vs cold memories by emotion</p>
        </div>
      </div>

      {memoryTemperatures.length > 0 ? (
        <div className="space-y-6">
          {/* Temperature Stats */}
          <div className="grid grid-cols-5 gap-3">
            {[
              { key: 'frozen', label: 'Frozen', emoji: '🥶', count: stats.frozen, color: 'bg-blue-900' },
              { key: 'cold', label: 'Cold', emoji: '❄️', count: stats.cold, color: 'bg-cyan-600' },
              { key: 'cool', label: 'Cool', emoji: '😌', count: stats.cool, color: 'bg-green-500' },
              { key: 'warm', label: 'Warm', emoji: '☀️', count: stats.warm, color: 'bg-orange-500' },
              { key: 'hot', label: 'Hot', emoji: '🔥', count: stats.hot, color: 'bg-red-600' },
            ].map(stat => (
              <div key={stat.key} className={`${stat.color} rounded-lg p-4 text-center`}>
                <div className="text-2xl mb-1">{stat.emoji}</div>
                <div className="text-2xl font-bold text-white">{stat.count}</div>
                <div className="text-xs text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Temperature Thermometer */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-600">
            <h3 className="text-lg font-semibold text-white mb-4">Memory Thermometer</h3>
            <div className="relative h-8 bg-gradient-to-r from-blue-900 via-green-500 to-red-600 rounded-full overflow-hidden">
              {memoryTemperatures.map((memory) => (
                <div
                  key={memory.id}
                  className="absolute top-0 bottom-0 w-1 bg-white/50 hover:bg-white hover:w-2 transition-all cursor-pointer group"
                  style={{ left: `${memory.temperature}%` }}
                  title={`${memory.title}: ${memory.temperature.toFixed(0)}°`}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {memory.title}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>❄️ Frozen (0°)</span>
              <span>😌 Cool (50°)</span>
              <span>🔥 Hot (100°)</span>
            </div>
          </div>

          {/* Memory List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">All Memories by Temperature</h3>
            {memoryTemperatures.map((memory) => (
              <div
                key={memory.id}
                className={`bg-gradient-to-r ${memory.color} rounded-xl p-4 flex items-center gap-4`}
              >
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  {memory.icon}
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white">{memory.title}</h4>
                    <span className="text-2xl">{getCategoryEmoji(memory.category)}</span>
                  </div>
                  <p className="text-sm text-white/80">{getCategoryDescription(memory.category)}</p>
                </div>
                
                <div className="flex-shrink-0 text-right">
                  <div className="text-3xl font-bold text-white">{memory.temperature.toFixed(0)}°</div>
                  <div className="text-xs text-white/70 uppercase font-semibold">{memory.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <Thermometer className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No journeys yet. Create journeys to see their memory temperature!</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 bg-orange-900/20 border border-orange-700/50 rounded-lg p-4">
        <p className="text-sm text-orange-300">
          <strong>💡 How it works:</strong> Memory temperature is calculated using AI sentiment analysis. 
          Positive, exciting memories are "hot" 🔥, while challenging or calm experiences are "cool" ❄️.
        </p>
      </div>
    </div>
  );
}
