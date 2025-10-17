// Travel DNA Profile - Personality visualization
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Dna } from 'lucide-react';
import { TravelDNA } from '../utils/travelDNA';

interface TravelDNAProfileProps {
  personality: TravelDNA;
}

export default function TravelDNAProfile({ personality }: TravelDNAProfileProps) {
  const data = [
    { trait: 'Nature', value: personality.nature },
    { trait: 'City', value: personality.city },
    { trait: 'Culture', value: personality.culture },
    { trait: 'Adventure', value: personality.adventure },
  ];

  const dominantTrait = personality.dominantTrait || 'Balanced';
  const colorCode = '#8b5cf6'; // purple

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-700/50">
      <div className="flex items-center gap-3 mb-4">
        <Dna className="w-6 h-6 text-purple-400" />
        <h3 className="text-2xl font-bold text-white">Your Travel DNA</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid stroke="#94a3b8" />
              <PolarAngleAxis 
                dataKey="trait" 
                tick={{ fill: '#e2e8f0', fontSize: 12 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
              />
              <Radar
                name="Travel DNA"
                dataKey="value"
                stroke={colorCode}
                fill={colorCode}
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* DNA Breakdown */}
        <div className="space-y-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-sm text-slate-400 mb-1">Dominant Trait</div>
            <div className="text-2xl font-bold" style={{ color: colorCode }}>
              {dominantTrait}
            </div>
            <div className="text-sm text-slate-300 mt-2">
              {personality.summary || 'Discover your unique travel personality'}
            </div>
          </div>

          <div className="space-y-2">
            {Object.entries(personality).filter(([key]) => ['nature', 'city', 'culture', 'adventure'].includes(key)).map(([trait, value]) => (
              <div key={trait} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 capitalize">{trait}</span>
                  <span className="text-slate-400">{value}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${value}%`,
                      backgroundColor: colorCode
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="text-center">
          <div className="inline-block px-4 py-2 rounded-full text-sm font-medium" 
               style={{ backgroundColor: `${colorCode}20`, color: colorCode }}>
            🧬 Your Travel Personality Code
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Based on your journey patterns and destinations
          </div>
        </div>
      </div>
    </div>
  );
}
