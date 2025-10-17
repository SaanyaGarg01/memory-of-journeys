// src/utils/travelDNA.ts
// Enhanced Travel DNA Scorer — computes your travel personality profile (Nature, City, Culture, Adventure)
// Based on journey legs, keywords, and inferred interests.

import { JourneyLeg } from '../lib/supabase';

export type TravelDNA = {
  nature: number;
  city: number;
  culture: number;
  adventure: number;
  dominantTrait?: string;
  summary?: string;
};

// Clamp utility to keep values within 0–100
function clamp(n: number) {
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

/**
 * Calculates a travel personality profile from journey legs.
 * This uses keyword analysis and destination hints to create
 * a 4-dimensional Travel DNA (nature, city, culture, adventure).
 */
export function getTravelDNA(legs: JourneyLeg[]): TravelDNA {
  if (!legs || legs.length === 0) {
    return { nature: 25, city: 25, culture: 25, adventure: 25, dominantTrait: 'Balanced', summary: 'You enjoy all kinds of journeys equally!' };
  }

  let nature = 0, city = 0, culture = 0, adventure = 0;

  legs.forEach((leg) => {
    const keywordsText = Array.isArray((leg as any).keywords)
      ? (leg as any).keywords.join(' ')
      : '';
    const text = `${leg.fromCity ?? ''} ${leg.toCity ?? ''} ${keywordsText}`.toLowerCase();

    // Nature lovers
    if (text.match(/beach|island|sea|coast|surf|snorkel|reef|ocean|waterfall|lake|bay|forest|national park/)) nature += 3;
    if (text.match(/mountain|peak|hike|trek|valley|camp|trail|ridge|hill station/)) { nature += 3; adventure += 2; }

    // Cultural enthusiasts
    if (text.match(/temple|mosque|church|museum|heritage|old town|ruins|history|festival|art/)) culture += 3;

    // Urban explorers
    if (text.match(/mall|street|market|metro|city|downtown|skyscraper|shopping|nightlife|cafe|restaurant|urban/)) city += 3;

    // Adventurers
    if (text.match(/hike|trek|bungee|paragliding|rafting|safari|climb|offroad|zipline|skydiving/)) adventure += 3;
    if (text.match(/campfire|road trip|solo/)) adventure += 2;
  });

  // Normalize to 100%
  const total = nature + city + culture + adventure;
  if (total === 0) {
    return { nature: 25, city: 25, culture: 25, adventure: 25, dominantTrait: 'Balanced', summary: 'You enjoy a mix of all travel styles.' };
  }

  const out = {
    nature: Math.round((nature / total) * 100),
    city: Math.round((city / total) * 100),
    culture: Math.round((culture / total) * 100),
    adventure: Math.round((adventure / total) * 100),
  };

  // Fix rounding errors
  const sum = out.nature + out.city + out.culture + out.adventure;
  if (sum !== 100) {
    out.nature = clamp(out.nature + (100 - sum));
  }

  // Identify dominant trait
  const entries = Object.entries(out);
  const dominant = entries.sort((a, b) => b[1] - a[1])[0][0];

  const summaries: Record<string, string> = {
    nature: 'You feel most alive surrounded by nature — beaches, forests, and mountains call your name.',
    city: 'You thrive in bustling cities, finding stories in every street and skyline.',
    culture: 'You travel to learn — temples, museums, and festivals are your favorite chapters.',
    adventure: 'You chase adrenaline and new challenges — from cliffs to camps, you seek the unknown.',
  };

  return {
    ...out,
    dominantTrait: dominant.charAt(0).toUpperCase() + dominant.slice(1),
    summary: summaries[dominant],
  };
}
