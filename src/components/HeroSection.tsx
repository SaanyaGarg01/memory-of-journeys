import { Plane, Sparkles, TrendingUp, Users } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900" />

      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl animate-pulse delay-700" />
      </div>

      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <div className="mb-8 animate-fade-in flex justify-center">
          <img 
            src="/logo.jpg" 
            alt="Memory of Journeys Logo" 
            className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-300 text-sm mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4" />
          <span>MariaDB Vector Search × AI Storytelling</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in-up leading-tight">
          Memory of Journeys
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 mb-4 animate-fade-in-up animation-delay-200">
          Transform Your Travels Into
          <span className="block mt-2 bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text font-bold">
            Living Stories
          </span>
        </p>

        <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto animate-fade-in-up animation-delay-300">
          Powered by vector embeddings and AI, we turn flight data into human narratives,
          cultural insights, and meaningful connections
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up animation-delay-400">
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/50"
          >
            <Plane className="w-5 h-5" />
            Create Your Journey
          </button>
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-slate-800/50 border border-slate-700 text-white font-semibold rounded-lg hover:bg-slate-800 transition-all transform hover:scale-105 active:scale-95"
          >
            Explore Stories
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-fade-in-up animation-delay-500">
          <div className="p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI Storytelling</h3>
            <p className="text-gray-400 text-sm">
              Transform routes into narratives with cultural context and historical significance
            </p>
          </div>

          <div className="p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Vector Analytics</h3>
            <p className="text-gray-400 text-sm">
              Discover similarity scores and rarity rankings powered by vector embeddings
            </p>
          </div>

          <div className="p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Global Community</h3>
            <p className="text-gray-400 text-sm">
              Share experiences and discover journeys from travelers worldwide
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
