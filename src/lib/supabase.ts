import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ------------------ Types ------------------ //

export type JourneyLeg = {
  from: string;
  to: string;
  fromCity: string;
  toCity: string;
  fromCountry: string;
  toCountry: string;
  date?: string;
  distance?: number;
};

export type Journey = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  journey_type: 'solo' | 'family' | 'backpacking' | 'honeymoon' | 'business' | 'adventure';
  departure_date: string;
  return_date: string;
  legs: JourneyLeg[];
  keywords: string[];
  ai_story: string;
  similarity_score: number;
  rarity_score: number;
  cultural_insights: Record<string, any>;
  visibility: 'public' | 'private' | 'friends';
  likes_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
};

// ------------------ User Profile ------------------ //
export type UserProfile = {
  id: string;               // Firebase UID
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  interests?: string[];
  created_at?: string;
  updated_at?: string;
};

// ------------------ Airport ------------------ //
export type Airport = {
  id: number;
  name: string;
  city: string;
  country: string;
  iata: string;
  latitude: number;
  longitude: number;
  cultural_facts?: Record<string, any>;
};
