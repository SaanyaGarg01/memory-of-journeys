// AI-Generated Postcards Feature
import { useState } from 'react';
import { FileText, Download, Sparkles, Image as ImageIcon } from 'lucide-react';

interface Journey {
  id: string;
  title: string;
  description: string;
  departure_date: string;
  legs: Array<{ from: string; to: string }>;
}

interface PostcardGeneratorProps {
  journeys: Journey[];
}

export default function PostcardGenerator({ journeys }: PostcardGeneratorProps) {
  const [selectedJourney, setSelectedJourney] = useState<string>('');
  const [postcardMessage, setPostcardMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePostcardMessage = (journey: Journey) => {
    setIsGenerating(true);
    
    // AI-powered postcard message generation
    setTimeout(() => {
      const destinations = journey.legs.map(leg => leg.to).join(', ');
      const messages = [
        `Greetings from ${destinations}! ${journey.description || 'Having an amazing time exploring new places and creating unforgettable memories.'}`,
        `Wish you were here in ${destinations}! Every moment of this ${journey.title} has been absolutely magical. Can't wait to share stories!`,
        `Postcard from paradise! Exploring ${destinations} has been a dream come true. The sights, sounds, and experiences are beyond words!`,
        `Hello from my ${journey.title}! ${destinations} is treating me well. Every day brings new adventures and beautiful discoveries.`
      ];
      
      const message = messages[Math.floor(Math.random() * messages.length)];
      setPostcardMessage(message);
      setIsGenerating(false);
    }, 1000);
  };

  const downloadPostcard = () => {
    const journey = journeys.find(j => j.id === selectedJourney);
    if (!journey) return;

    // Create a simple text-based postcard for download
    const postcardText = `
╔═══════════════════════════════════════════╗
║          MEMORY OF JOURNEYS               ║
║           Digital Postcard                ║
╚═══════════════════════════════════════════╝

${journey.title}
${new Date(journey.departure_date).toLocaleDateString()}

${postcardMessage}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Route: ${journey.legs.map(leg => `${leg.from} → ${leg.to}`).join(' → ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated with ❤️ by Memory of Journeys
    `;

    const blob = new Blob([postcardText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postcard-${journey.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedJourneyData = journeys.find(j => j.id === selectedJourney);

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">AI-Generated Postcards</h2>
          <p className="text-slate-400 text-sm">Create beautiful postcards from your memories</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Journey Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Select a Journey
          </label>
          <select
            value={selectedJourney}
            onChange={(e) => {
              setSelectedJourney(e.target.value);
              setPostcardMessage('');
            }}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
          >
            <option value="">Choose a journey...</option>
            {journeys.map(journey => (
              <option key={journey.id} value={journey.id}>
                {journey.title} - {new Date(journey.departure_date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        {/* Generate Button */}
        {selectedJourney && !postcardMessage && (
          <button
            onClick={() => generatePostcardMessage(selectedJourneyData!)}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                Generating AI Message...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Postcard Message
              </>
            )}
          </button>
        )}

        {/* Postcard Preview */}
        {postcardMessage && selectedJourneyData && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 shadow-xl border-4 border-white">
              {/* Postcard Front */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-orange-900">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-xs font-mono">POSTCARD</span>
                </div>
                
                <div className="border-2 border-orange-200 rounded-lg p-4 bg-white/50">
                  <div className="text-center mb-3">
                    <h3 className="text-xl font-bold text-orange-900">{selectedJourneyData.title}</h3>
                    <p className="text-xs text-orange-700">
                      {new Date(selectedJourneyData.departure_date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  
                  <div className="text-orange-900 text-sm leading-relaxed italic">
                    {postcardMessage}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-orange-200">
                    <div className="text-xs text-orange-700 font-mono">
                      {selectedJourneyData.legs.map((leg, i) => (
                        <span key={i}>
                          {leg.from} → {leg.to}
                          {i < selectedJourneyData.legs.length - 1 && ' • '}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="text-right text-xs text-orange-700 font-mono">
                  Memory of Journeys ✈️
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={downloadPostcard}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <Download className="w-5 h-5" />
                Download Postcard
              </button>
              <button
                onClick={() => generatePostcardMessage(selectedJourneyData)}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-600 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                Generate New Message
              </button>
            </div>
          </div>
        )}

        {journeys.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No journeys yet. Create a journey to generate postcards!</p>
          </div>
        )}
      </div>
    </div>
  );
}
