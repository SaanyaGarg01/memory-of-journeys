// Memory Whispers Feature - AI-generated letters from past memories
import { useState } from 'react';
import { Mail, Send, Calendar, MapPin, Sparkles, Heart, Clock } from 'lucide-react';

interface Journey {
  id: string;
  title: string;
  description: string;
  departure_date: string;
  return_date: string;
  legs: Array<{ from: string; to: string; fromCity: string; toCity: string; fromCountry: string; toCountry: string }>;
  ai_story?: string;
}

interface MemoryLetter {
  id: string;
  subject: string;
  date: string;
  content: string;
  journeyTitle: string;
  location: string;
  mood: string;
  color: string;
}

interface MemoryWhispersProps {
  journeys: Journey[];
}

export default function MemoryWhispers({ journeys }: MemoryWhispersProps) {
  const [letters, setLetters] = useState<MemoryLetter[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<MemoryLetter | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailFrequency, setEmailFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [emailEnabled, setEmailEnabled] = useState(false);

  const generateLetter = (journey: Journey): MemoryLetter => {
    const destinations = journey.legs.map(leg => leg.toCity).join(', ');
    const firstDestination = journey.legs[0] || { toCity: 'Unknown', toCountry: 'Unknown' };
    
    const subjects = [
      `Remember when we explored ${firstDestination.toCity}?`,
      `A whisper from ${firstDestination.toCity}...`,
      `Your journey to ${destinations} - A memory revisited`,
      `Echoes from ${journey.title}`,
      `${firstDestination.toCity} is calling from your memories`,
    ];

    const openings = [
      `Dear Traveler,\n\nI hope this letter finds you well. I'm a whisper from your past, carrying memories of`,
      `Hello, old friend,\n\nDo you remember the feeling of`,
      `Greetings from the archives of your heart,\n\nThis is a gentle reminder of`,
      `My dear adventurer,\n\nTime has passed, but the memories of`,
      `Dear keeper of memories,\n\nI'm writing to you about`,
    ];

    const bodyTemplates = [
      `${journey.title}? It's been a while since you walked through ${destinations}. I remember how you felt when you first arrived - the excitement, the curiosity, the sense of adventure that filled your heart.

${journey.ai_story || journey.description || 'Every moment was special, from the early morning starts to the late evening reflections. You discovered not just new places, but new parts of yourself.'}

The journey taught you resilience, opened your eyes to different perspectives, and reminded you of the beauty that exists in the world. Those experiences shaped who you are today.

Sometimes, in the quiet moments, you can still feel the warmth of that sun, hear the sounds of the streets, taste the local cuisine. These aren't just memories - they're treasures that will stay with you forever.

Thank you for collecting me, for living me, for making me part of your story.`,

      `the adventure that unfolded in ${destinations}? The journey began on ${new Date(journey.departure_date).toLocaleDateString()}, and what followed was nothing short of magical.

${journey.description || journey.title} - these words barely capture the essence of what you experienced. The connections you made, the sights that took your breath away, the challenges you overcame - they all contributed to an unforgettable chapter of your life.

I've been waiting here, in the quiet corners of your mind, hoping you'd remember. Not with sadness for what's passed, but with joy for what was shared. Every photograph you took, every journal entry you wrote, every moment you paused to take it all in - they all matter.

Life moves fast, and sometimes we forget to look back. But I'm here to remind you: you're capable of amazing adventures. You've proven it. And there are more memories waiting to be made.

Keep that adventurous spirit alive. The world is still out there, waiting for you.`,

      `your incredible journey through ${destinations}. From ${new Date(journey.departure_date).toLocaleDateString()} to ${new Date(journey.return_date).toLocaleDateString()}, you embarked on something truly special.

${journey.ai_story || `What started as a simple trip became a transformative experience. ${firstDestination.toCity} welcomed you with open arms, and you embraced every moment with enthusiasm and wonder.`}

I often think about the version of you that existed during that journey - so present, so alive, so open to new experiences. That person is still within you, ready to emerge whenever you choose to seek new adventures.

The memories we create define us. They remind us of our courage, our capacity for joy, and our ability to adapt and grow. Your journey to ${destinations} is one such memory - a testament to your adventurous soul.

As you read this, I hope you feel that familiar flutter of excitement, that pull toward the unknown, that desire to explore. Because the best memories? They're still ahead of you.

Until we meet again in your next adventure...`,
    ];

    const moods = ['Nostalgic', 'Joyful', 'Reflective', 'Inspiring', 'Heartwarming'];
    const colors = [
      'from-blue-900/30 to-indigo-900/30 border-blue-700/50',
      'from-purple-900/30 to-pink-900/30 border-purple-700/50',
      'from-green-900/30 to-emerald-900/30 border-green-700/50',
      'from-orange-900/30 to-amber-900/30 border-orange-700/50',
      'from-rose-900/30 to-red-900/30 border-rose-700/50',
    ];

    const moodIndex = Math.floor(Math.random() * moods.length);

    return {
      id: `letter-${journey.id}-${Date.now()}`,
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      date: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      content: openings[Math.floor(Math.random() * openings.length)] + ' ' + 
               bodyTemplates[Math.floor(Math.random() * bodyTemplates.length)],
      journeyTitle: journey.title,
      location: `${firstDestination.toCity}, ${firstDestination.toCountry}`,
      mood: moods[moodIndex],
      color: colors[moodIndex],
    };
  };

  const generateNewLetter = () => {
    if (journeys.length === 0) return;

    setIsGenerating(true);

    setTimeout(() => {
      // Pick a random journey
      const randomJourney = journeys[Math.floor(Math.random() * journeys.length)];
      const newLetter = generateLetter(randomJourney);
      
      setLetters([newLetter, ...letters]);
      setSelectedLetter(newLetter);
      setIsGenerating(false);
    }, 2000);
  };

  const toggleEmailSubscription = () => {
    setEmailEnabled(!emailEnabled);
    if (!emailEnabled) {
      // Show confirmation message
      setTimeout(() => {
        alert(`✅ Memory Whispers subscription activated!\n\nYou'll receive ${emailFrequency} letters from your travel memories.\n\n(This is a demo - in production, emails would be sent via email service)`);
      }, 100);
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Memory Whispers</h2>
          <p className="text-slate-400 text-sm">Receive AI-generated letters from your past travels</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Email Subscription Settings */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Send className="w-5 h-5" />
            Email Subscription
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Delivery Frequency
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['weekly', 'biweekly', 'monthly'] as const).map(freq => (
                  <button
                    key={freq}
                    onClick={() => setEmailFrequency(freq)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      emailFrequency === freq
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-indigo-900/20 border border-indigo-700/50 rounded-lg">
              <div>
                <p className="font-medium text-white">Enable Memory Whispers</p>
                <p className="text-sm text-slate-400">
                  Receive {emailFrequency} letters about your travel memories
                </p>
              </div>
              <button
                onClick={toggleEmailSubscription}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailEnabled ? 'bg-indigo-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {emailEnabled && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Heart className="w-4 h-4" />
                <span>Subscription active! Next letter arrives in {emailFrequency === 'weekly' ? '7 days' : emailFrequency === 'biweekly' ? '14 days' : '30 days'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Generate Letter Button */}
        {journeys.length > 0 && (
          <button
            onClick={generateNewLetter}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-6 py-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                Generating Memory Letter...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Generate Memory Letter Now
              </>
            )}
          </button>
        )}

        {/* Letter Display */}
        {selectedLetter && (
          <div className={`bg-gradient-to-br ${selectedLetter.color} rounded-xl p-8 border`}>
            {/* Letter Header */}
            <div className="border-b border-white/10 pb-4 mb-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-400">Memory Whisper</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="w-4 h-4" />
                  {selectedLetter.date}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{selectedLetter.subject}</h3>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {selectedLetter.location}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {selectedLetter.mood}
                </span>
              </div>
            </div>

            {/* Letter Content */}
            <div className="prose prose-invert max-w-none">
              <div className="text-slate-200 leading-relaxed whitespace-pre-line">
                {selectedLetter.content}
              </div>
            </div>

            {/* Letter Footer */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-sm text-slate-400 italic">
                With love from your memories,<br />
                Memory Whispers AI ✨
              </p>
            </div>
          </div>
        )}

        {/* Letters Archive */}
        {letters.length > 1 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Previous Letters ({letters.length - 1})
            </h3>
            <div className="grid gap-3">
              {letters.slice(1).map(letter => (
                <button
                  key={letter.id}
                  onClick={() => setSelectedLetter(letter)}
                  className="text-left bg-slate-800/50 hover:bg-slate-800 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-white">{letter.subject}</h4>
                    <span className="text-xs text-slate-500">{letter.mood}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {letter.location}
                    </span>
                    <span>{letter.date}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {journeys.length === 0 && (
          <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700">
            <Mail className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">Create journeys to receive memory whispers</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-indigo-900/20 border border-indigo-700/50 rounded-lg p-4">
          <p className="text-sm text-indigo-300">
            <strong>💌 About Memory Whispers:</strong> AI analyzes your travel journeys and crafts 
            personalized, heartfelt letters that remind you of your adventures. Each letter is unique, 
            emotional, and designed to bring back the feelings and experiences of your travels.
          </p>
        </div>
      </div>
    </div>
  );
}
