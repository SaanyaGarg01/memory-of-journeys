import { JourneyLeg } from '../lib/supabase';
import { culturalInsights } from '../data/sampleAirports';

export function generateAIStory(
  legs: JourneyLeg[],
  journeyType: string,
  keywords: string[]
): string {
  if (legs.length === 0) return '';

  const startCity = legs[0].fromCity;
  const endCity = legs[legs.length - 1].toCity;
  const cities = [startCity, ...legs.map(leg => leg.toCity)];
  const uniqueCountries = Array.from(new Set(legs.flatMap(leg => [leg.fromCountry, leg.toCountry])));

  const journeyTypeStories: Record<string, string[]> = {
    solo: [
      'embarked on a transformative solo adventure',
      'discovered themselves through the eyes of strangers',
      'found freedom in the unknown paths',
      'embraced the solitude of distant lands'
    ],
    family: [
      'created unforgettable memories together',
      'bonded over shared adventures and new experiences',
      'explored the world through multiple generations',
      'built traditions that would last a lifetime'
    ],
    backpacking: [
      'followed the timeless backpacker trail',
      'lived out of a backpack, rich in experiences',
      'connected with fellow wanderers along the way',
      'found luxury in simplicity and authentic connections'
    ],
    honeymoon: [
      'began their forever journey together',
      'celebrated love across continents',
      'created the first chapter of their shared story',
      'wove romance into every sunset and sunrise'
    ],
    business: [
      'merged professional pursuits with cultural exploration',
      'expanded horizons beyond boardrooms',
      'discovered that business and adventure blend beautifully',
      'found opportunities in unexpected places'
    ],
    adventure: [
      'pushed boundaries and embraced challenges',
      'sought thrills in uncharted territories',
      'transformed fear into exhilaration',
      'collected stories that would be told for years'
    ]
  };

  const typeStory = journeyTypeStories[journeyType]?.[Math.floor(Math.random() * journeyTypeStories[journeyType].length)]
    || 'embarked on an incredible journey';

  let story = `This traveler ${typeStory} from ${startCity} to ${endCity}, `;

  if (uniqueCountries.length === 1) {
    story += `exploring the diverse landscapes of ${uniqueCountries[0]}. `;
  } else if (uniqueCountries.length === 2) {
    story += `bridging two worlds between ${uniqueCountries[0]} and ${uniqueCountries[1]}. `;
  } else {
    story += `crossing ${uniqueCountries.length} countries in an epic multi-continental odyssey. `;
  }

  const culturalElements: string[] = [];
  cities.forEach(city => {
    const insights = culturalInsights[city];
    if (insights) {
      if (insights.highlights) {
        culturalElements.push(...insights.highlights.slice(0, 2));
      }
    }
  });

  if (culturalElements.length > 0) {
    const selectedElements = culturalElements.slice(0, 3);
    story += `Along the way, they experienced ${selectedElements.join(', ')}, `;
  }

  if (keywords.length > 0) {
    const keywordPhrase = keywords.slice(0, 3).join(', ');
    story += `focusing on ${keywordPhrase}. `;
  }

  const continuations = [
    'Each destination revealed layers of history, culture, and human connection that transformed perspective and enriched the soul.',
    'This route has been traveled by countless adventurers, each adding their own chapter to its living story.',
    'What began as coordinates on a map became a tapestry of faces, flavors, and moments that define what it means to truly live.',
    'The journey proved that the best destinations are not places, but the moments and people discovered along the way.',
    'Every mile traversed added not just stamps to a passport, but stories to a lifetime collection of meaningful experiences.'
  ];

  story += continuations[Math.floor(Math.random() * continuations.length)];

  return story;
}

export function calculateSimilarityScore(legs: JourneyLeg[]): number {
  const popularRoutes = [
    ['New Delhi', 'Bangkok', 'Bali'],
    ['London', 'Paris', 'Rome'],
    ['Tokyo', 'Seoul', 'Hong Kong'],
    ['New York', 'Los Angeles', 'San Francisco'],
    ['Bangkok', 'Singapore', 'Bali'],
    ['Dubai', 'Singapore', 'Sydney']
  ];

  const cities = legs.map(leg => leg.toCity);

  let maxSimilarity = 0;
  popularRoutes.forEach(route => {
    let matches = 0;
    route.forEach(city => {
      if (cities.includes(city)) matches++;
    });
    const similarity = (matches / Math.max(route.length, cities.length)) * 100;
    maxSimilarity = Math.max(maxSimilarity, similarity);
  });

  const randomVariation = Math.random() * 15 - 7.5;
  return Math.min(100, Math.max(0, maxSimilarity + randomVariation));
}

export function calculateRarityScore(legs: JourneyLeg[], journeyType: string): number {
  let rarityScore = 50;

  if (legs.length === 1) {
    rarityScore = 20;
  } else if (legs.length === 2) {
    rarityScore = 35;
  } else if (legs.length >= 5) {
    rarityScore += 25;
  }

  const countries = Array.from(new Set(legs.flatMap(leg => [leg.fromCountry, leg.toCountry])));
  if (countries.length >= 4) {
    rarityScore += 20;
  } else if (countries.length >= 3) {
    rarityScore += 10;
  }

  const continents = countries.map(country => {
    const asianCountries = ['India', 'Thailand', 'Indonesia', 'Japan', 'Singapore', 'Hong Kong', 'South Korea'];
    const europeanCountries = ['United Kingdom', 'France', 'Spain', 'Italy', 'Netherlands', 'Germany'];
    const americanCountries = ['United States', 'Canada', 'Mexico', 'Brazil', 'Argentina'];
    const middleEastCountries = ['United Arab Emirates', 'Turkey', 'Egypt'];

    if (asianCountries.includes(country)) return 'Asia';
    if (europeanCountries.includes(country)) return 'Europe';
    if (americanCountries.includes(country)) return 'Americas';
    if (middleEastCountries.includes(country)) return 'Middle East';
    return 'Other';
  });

  const uniqueContinents = Array.from(new Set(continents));
  if (uniqueContinents.length >= 3) {
    rarityScore += 15;
  }

  if (['honeymoon', 'adventure'].includes(journeyType)) {
    rarityScore += 5;
  }

  const randomVariation = Math.random() * 10 - 5;
  return Math.min(100, Math.max(0, rarityScore + randomVariation));
}

export function getCulturalInsights(legs: JourneyLeg[]): Record<string, any> {
  const insights: Record<string, any> = {};

  const cities = Array.from(new Set([...legs.map(leg => leg.fromCity), ...legs.map(leg => leg.toCity)]));

  cities.forEach(city => {
    if (culturalInsights[city]) {
      insights[city] = culturalInsights[city];
    }
  });

  return insights;
}
