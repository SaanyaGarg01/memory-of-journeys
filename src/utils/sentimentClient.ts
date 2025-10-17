import Sentiment from 'sentiment';

const sentiment = new Sentiment();

export interface MoodResult {
  score: number;
  comparative: number;
  label: string;
}

export function analyzeTextMood(text: string): MoodResult {
  if (!text || text.trim().length === 0) {
    return { score: 0, comparative: 0, label: 'neutral' };
  }

  try {
    const res = sentiment.analyze(text);
    const score: number = res.score || 0;
    const comparative: number = res.comparative ?? 0;

    let label = 'neutral';
    if (score >= 3) label = 'joyful';
    else if (score >= 1) label = 'positive';
    else if (score <= -3) label = 'sad';
    else if (score <= -1) label = 'negative';

    return { score, comparative, label };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return { score: 0, comparative: 0, label: 'neutral' };
  }
}
