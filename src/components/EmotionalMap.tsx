// Emotional Map - Sentiment visualization
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Heart, TrendingUp } from 'lucide-react';
import { analyzeTextMood } from '../utils/sentimentClient';

interface EmotionalMapProps {
  emotionalData: Array<{
    date: string;
    location: string;
    score: number;
    emotion: string;
  }>;
}

function getEmotionIcon(emotion: string): string {
  const icons: Record<string, string> = {
    joyful: '🎉',
    positive: '😊',
    neutral: '😌',
    negative: '💭',
    sad: '🤔'
  };
  return icons[emotion] || '✨';
}

export default function EmotionalMap({ emotionalData }: EmotionalMapProps) {
  const chartData = emotionalData.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: item.score,
    location: item.location,
    emotion: item.emotion
  }));

  const averageScore = emotionalData.reduce((sum, item) => sum + item.score, 0) / emotionalData.length || 0;
  const dominantEmotion = getMostFrequentEmotion(emotionalData);

  return (
    <div className="bg-gradient-to-br from-pink-900/30 to-rose-900/30 backdrop-blur-sm rounded-2xl p-6 border border-pink-700/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-pink-400" />
          <h3 className="text-2xl font-bold text-white">Emotional Memory Map</h3>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Average Mood</div>
          <div className="text-2xl font-bold text-pink-400">
            {averageScore > 0 ? '+' : ''}{averageScore.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Mood Timeline Graph */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="emotionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              domain={[-5, 5]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: any, _name: string, props: any) => [
                `${value > 0 ? '+' : ''}${value.toFixed(2)}`,
                props.payload.location
              ]}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#ec4899"
              fillOpacity={1}
              fill="url(#emotionGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Emotion Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['joyful', 'positive', 'neutral', 'sad'].map(emotion => {
          const count = emotionalData.filter(d => d.emotion === emotion).length;
          const percentage = (count / emotionalData.length) * 100 || 0;
          
          return (
            <div key={emotion} className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-2xl mb-1">{getEmotionIcon(emotion)}</div>
              <div className="text-sm text-slate-300 capitalize">{emotion}</div>
              <div className="text-xl font-bold text-white mt-1">{percentage.toFixed(0)}%</div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-pink-400" />
          <span className="text-white font-medium">Your Travel Emotion:</span>
          <span className="text-pink-400 capitalize">{dominantEmotion}</span>
          <span className="ml-auto text-2xl">{getEmotionIcon(dominantEmotion)}</span>
        </div>
      </div>
    </div>
  );
}

function getMostFrequentEmotion(data: Array<{ emotion: string }>): string {
  const counts: Record<string, number> = {};
  data.forEach(item => {
    counts[item.emotion] = (counts[item.emotion] || 0) + 1;
  });
  
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'calm';
}
