// Voice Journaling Feature
import { useState, useRef } from 'react';
import { Mic, Square, Save, Trash2, Sparkles } from 'lucide-react';

interface VoiceJournalingProps {
  onSave: (transcript: string) => void;
}

export default function VoiceJournaling({ onSave }: VoiceJournalingProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string>('');
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please ensure you have granted permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = () => {
    setIsTranscribing(true);
    
    // Simulated AI transcription (in production, use Web Speech API or cloud service)
    setTimeout(() => {
      const sampleTranscripts = [
        "What an incredible day exploring the city! We started early morning at the local market, where the vibrant colors and aromatic spices created such a memorable atmosphere. The locals were incredibly welcoming, and we tried so many new foods. In the afternoon, we visited the historical district and learned fascinating stories about the region's past. The architecture was breathtaking, especially the old cathedral with its stunning stained glass windows. As the sun set, we found this amazing viewpoint overlooking the entire city. It was the perfect way to end our day, watching the city lights slowly illuminate the skyline.",
        "Today was all about adventure! We hiked up to the mountain peak, and despite the challenging trail, the views from the top made every step worth it. The fresh air, the sound of birds, and the feeling of accomplishment when we reached the summit - absolutely unforgettable. Met some fellow travelers on the way who shared interesting stories about their own journeys. We took countless photos, had a picnic at the peak, and just soaked in the natural beauty around us.",
        "A more relaxed day today, but equally memorable. Spent the morning at a cozy local café, writing postcards and reflecting on our journey so far. In the afternoon, we stumbled upon a small art gallery showcasing local artists. Each piece told a story about the region's culture and history. Later, we attended a traditional music performance in the town square. The melodies were enchanting, and many locals joined in dancing. It was such a beautiful cultural experience that reminded me why I love traveling - these authentic, unexpected moments.",
        "Beach day! Woke up to the sound of waves and spent most of the day by the ocean. The water was crystal clear, and we could see tropical fish swimming near the shore. Tried some water sports - paddleboarding was trickier than I expected! Had fresh seafood for lunch at a beachside restaurant, probably the best meal of the trip so far. As evening approached, we joined a beach bonfire where travelers from all over the world gathered to share stories and make new friends."
      ];
      
      const randomTranscript = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)];
      setTranscript(randomTranscript);
      setIsTranscribing(false);
    }, 2000);
  };

  const handleSave = () => {
    if (transcript) {
      onSave(transcript);
      setTranscript('');
      setAudioURL('');
    }
  };

  const handleDiscard = () => {
    setAudioURL('');
    setTranscript('');
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
          <Mic className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Voice Journaling</h2>
          <p className="text-slate-400 text-sm">Record your travel stories with your voice</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Recording Controls */}
        <div className="flex flex-col items-center justify-center py-8 bg-slate-800/50 rounded-xl border border-slate-700">
          {!isRecording && !audioURL && (
            <button
              onClick={startRecording}
              className="group relative w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
            >
              <Mic className="w-12 h-12 text-white" />
              <div className="absolute inset-0 rounded-full bg-green-400 opacity-0 group-hover:opacity-20 animate-pulse"></div>
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="relative w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center hover:scale-105 transition-transform shadow-xl animate-pulse"
            >
              <Square className="w-12 h-12 text-white" />
            </button>
          )}

          {audioURL && !transcript && (
            <div className="flex flex-col items-center gap-4">
              <audio src={audioURL} controls className="w-full max-w-md" />
              <button
                onClick={transcribeAudio}
                disabled={isTranscribing}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isTranscribing ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    Transcribing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Transcribe to Text
                  </>
                )}
              </button>
            </div>
          )}

          <p className="text-slate-400 text-sm mt-4">
            {isRecording ? 'Recording... Click to stop' : audioURL ? 'Recording complete' : 'Click to start recording'}
          </p>
        </div>

        {/* Transcription Display */}
        {transcript && (
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-600">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">AI Transcription</h3>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 leading-relaxed">{transcript}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <Save className="w-5 h-5" />
                Save to Journey
              </button>
              <button
                onClick={handleDiscard}
                className="flex items-center justify-center gap-2 bg-slate-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-600 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
          <p className="text-sm text-green-300">
            <strong>💡 Tip:</strong> Speak naturally and describe your experiences, feelings, and observations. 
            The AI will transcribe your voice and format it beautifully for your journey.
          </p>
        </div>
      </div>
    </div>
  );
}
