import { Brain, Database, LineChart, Map, Shield, Zap } from 'lucide-react';

export default function FeaturesShowcase() {
  const features = [
    {
      icon: Database,
      title: 'Vector-Powered Search',
      description: 'Advanced MariaDB vector embeddings enable lightning-fast similarity matching across millions of journey patterns',
      color: 'blue',
      stats: '384-dimensional embeddings'
    },
    {
      icon: Brain,
      title: 'AI Story Generation',
      description: 'Cultural insights and historical context automatically woven into personalized narratives for every journey',
      color: 'cyan',
      stats: 'GPT-enhanced narratives'
    },
    {
      icon: LineChart,
      title: 'Analytics Engine',
      description: 'Real-time pattern analysis reveals trending routes, rarity scores, and traveler demographics using ColumnStore',
      color: 'purple',
      stats: 'Real-time insights'
    },
    {
      icon: Map,
      title: 'Interactive Visualization',
      description: '3D globe with animated flight paths, cultural hotspots, and dynamic route optimization',
      color: 'green',
      stats: 'Immersive 3D experience'
    },
    {
      icon: Zap,
      title: 'Instant Similarity Matching',
      description: 'Compare your journey against global patterns in milliseconds using vector cosine similarity',
      color: 'amber',
      stats: '<100ms search time'
    },
    {
      icon: Shield,
      title: 'Privacy-First Design',
      description: 'Granular control over journey visibility with RLS-enforced security at the database level',
      color: 'red',
      stats: 'Military-grade RLS'
    }
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
    cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/50' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
    green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
    amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50' },
    red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  };

  return (
    <div className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Powered by Innovation
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Combining MariaDB's vector capabilities with AI storytelling to create
            an unprecedented travel intelligence platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const colors = colorClasses[feature.color];
            const Icon = feature.icon;

            return (
              <div
                key={index}
                className="group p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
              >
                <div className={`w-14 h-14 ${colors.bg} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-7 h-7 ${colors.text}`} />
                </div>

                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>

                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  {feature.description}
                </p>

                <div className={`inline-flex items-center px-3 py-1 ${colors.bg} border ${colors.border} rounded-full`}>
                  <span className={`text-xs font-medium ${colors.text}`}>
                    {feature.stats}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 p-8 bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-500/30 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-2">pgvector</div>
              <div className="text-gray-400 text-sm">Vector Extension</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400 mb-2">IVFFlat</div>
              <div className="text-gray-400 text-sm">Index Algorithm</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">Cosine</div>
              <div className="text-gray-400 text-sm">Similarity Metric</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
