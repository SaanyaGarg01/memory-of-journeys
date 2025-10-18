// Bonus Features Collection
import { Mail, Thermometer, Users, Mic, Image, FileText, ArrowRight } from 'lucide-react';

interface BonusFeaturesProps {
  onFeatureClick: (featureId: string) => void;
}

export default function BonusFeatures({ onFeatureClick }: BonusFeaturesProps) {
  const features = [
    {
      id: 'postcards',
      icon: <FileText className="w-8 h-8" />,
      title: 'AI-Generated Postcards',
      description: 'Create beautiful printable postcards with your photos, captions, and AI-written messages',
      color: 'from-blue-500 to-cyan-500',
      available: true
    },
    {
      id: 'temperature',
      icon: <Thermometer className="w-8 h-8" />,
      title: 'Memory Temperature',
      description: 'Visualize "warm" vs "cold" memories by analyzing emotion and weather patterns',
      color: 'from-orange-500 to-red-500',
      available: true
    },
    {
      id: 'voice',
      icon: <Mic className="w-8 h-8" />,
      title: 'Voice Journaling',
      description: 'Record your travel stories instead of typing - AI converts speech to beautifully formatted text',
      color: 'from-green-500 to-emerald-500',
      available: true
    },
    {
      id: 'gallery',
      icon: <Image className="w-8 h-8" />,
      title: 'Interactive Gallery Wall',
      description: 'Shuffle and arrange your travel photos like real polaroids on a digital corkboard',
      color: 'from-yellow-500 to-amber-500',
      available: true
    },
    {
      id: 'friends',
      icon: <Users className="w-8 h-8" />,
      title: 'Friend Memory Sync',
      description: 'Combine journeys with friends and let AI highlight shared moments and experiences',
      color: 'from-purple-500 to-pink-500',
      available: false
    },
    {
      id: 'whispers',
      icon: <Mail className="w-8 h-8" />,
      title: 'Memory Whispers',
      description: 'Receive weekly AI-generated letters from your past travel memories',
      color: 'from-indigo-500 to-violet-500',
      available: false
    }
  ];

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Bonus Features</h2>
        <p className="text-slate-400">Small but powerful additions to enhance your journey memories</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <div
            key={feature.id}
            onClick={() => feature.available && onFeatureClick(feature.id)}
            className={`group bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/30 transition-all ${
              feature.available ? 'hover:scale-105 cursor-pointer' : 'opacity-60'
            }`}
          >
            <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.color} mb-4`}>
              {feature.icon}
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
            <p className="text-sm text-slate-400">{feature.description}</p>
            
            <div className="mt-4">
              {feature.available ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to open <ArrowRight className="w-3 h-3" />
                </span>
              ) : (
                <span className="text-xs text-slate-500">Coming soon...</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Quick Win Ideas</h3>
            <p className="text-sm text-slate-300">Easy to implement, high impact features - 4 now available! ✨</p>
          </div>
          <div className="text-4xl">🎉</div>
        </div>
      </div>
    </div>
  );
}
