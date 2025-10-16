/*
  # Memory of Journeys Platform Schema

  ## Overview
  This migration creates the complete database schema for the Memory of Journeys platform,
  a revolutionary travel storytelling application that combines MariaDB-inspired vector search
  with AI-powered narrative generation.

  ## New Tables

  ### 1. `airports`
  Stores global airport data from OpenFlights dataset
  - `id` (bigint, primary key)
  - `name` (text) - Airport name
  - `city` (text) - City location
  - `country` (text) - Country
  - `iata` (text) - 3-letter IATA code
  - `icao` (text) - 4-letter ICAO code
  - `latitude` (float)
  - `longitude` (float)
  - `altitude` (int)
  - `timezone` (text)
  - `cultural_facts` (jsonb) - Cultural insights about the destination
  - `embedding` (vector(384)) - Vector embedding for similarity search

  ### 2. `airlines`
  Stores airline information
  - `id` (bigint, primary key)
  - `name` (text)
  - `alias` (text)
  - `iata` (text)
  - `icao` (text)
  - `callsign` (text)
  - `country` (text)
  - `active` (boolean)

  ### 3. `routes`
  Stores flight routes between airports
  - `id` (bigserial, primary key)
  - `airline_id` (bigint) - Foreign key to airlines
  - `source_airport_id` (bigint) - Foreign key to airports
  - `destination_airport_id` (bigint) - Foreign key to airports
  - `codeshare` (boolean)
  - `stops` (int)
  - `equipment` (text)
  - `popularity_score` (float) - Route popularity metric

  ### 4. `journeys`
  User-created journeys (multi-leg trips)
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Foreign key to auth.users
  - `title` (text)
  - `description` (text)
  - `journey_type` (text) - solo, family, backpacking, honeymoon, business
  - `departure_date` (date)
  - `return_date` (date)
  - `legs` (jsonb) - Array of journey legs with airport codes
  - `keywords` (text[]) - User-provided keywords
  - `ai_story` (text) - AI-generated narrative
  - `similarity_score` (float) - Computed similarity to common patterns
  - `rarity_score` (float) - How unique this journey is (0-100)
  - `cultural_insights` (jsonb) - Collected cultural facts
  - `embedding` (vector(384)) - Journey pattern embedding
  - `visibility` (text) - public, private, friends
  - `likes_count` (int)
  - `views_count` (int)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `journey_memories`
  User photos and memories attached to journeys
  - `id` (uuid, primary key)
  - `journey_id` (uuid) - Foreign key to journeys
  - `user_id` (uuid) - Foreign key to auth.users
  - `memory_type` (text) - photo, note, video
  - `content` (text) - URL or text content
  - `location` (text) - Where memory was captured
  - `captured_at` (timestamptz)
  - `created_at` (timestamptz)

  ### 6. `cultural_destinations`
  Rich cultural and historical data about destinations
  - `id` (uuid, primary key)
  - `city` (text)
  - `country` (text)
  - `description` (text)
  - `highlights` (text[])
  - `best_season` (text)
  - `famous_for` (text[])
  - `historical_facts` (jsonb)
  - `local_cuisine` (text[])
  - `travel_tips` (text[])
  - `embedding` (vector(384))

  ### 7. `journey_analytics`
  Analytics and pattern data
  - `id` (uuid, primary key)
  - `route_pattern` (text) - e.g., "US-EU-ASIA"
  - `journey_count` (int)
  - `avg_duration` (int) - Average days
  - `popular_months` (int[])
  - `common_keywords` (text[])
  - `traveler_types` (jsonb)
  - `updated_at` (timestamptz)

  ### 8. `user_profiles`
  Extended user profiles
  - `id` (uuid, primary key) - References auth.users
  - `username` (text, unique)
  - `display_name` (text)
  - `avatar_url` (text)
  - `bio` (text)
  - `home_airport` (text)
  - `travel_preferences` (jsonb)
  - `journeys_count` (int)
  - `countries_visited` (int)
  - `total_miles` (float)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 9. `journey_likes`
  Tracks likes on journeys
  - `id` (uuid, primary key)
  - `journey_id` (uuid) - Foreign key to journeys
  - `user_id` (uuid) - Foreign key to auth.users
  - `created_at` (timestamptz)

  ### 10. `journey_comments`
  Comments on shared journeys
  - `id` (uuid, primary key)
  - `journey_id` (uuid) - Foreign key to journeys
  - `user_id` (uuid) - Foreign key to auth.users
  - `content` (text)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all user-facing tables
  - Public read access for public journeys
  - Authenticated users can create and manage their own content
  - Restrictive policies ensure users can only modify their own data

  ## Important Notes
  - Vector columns use pgvector extension for similarity search
  - Embeddings are 384-dimensional (compatible with common sentence transformers)
  - Cultural data can be expanded post-launch with live APIs
  - Analytics table updated via triggers or scheduled functions
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Airports table
CREATE TABLE IF NOT EXISTS airports (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  iata text,
  icao text,
  latitude float NOT NULL,
  longitude float NOT NULL,
  altitude int DEFAULT 0,
  timezone text,
  cultural_facts jsonb DEFAULT '{}',
  embedding vector(384),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_airports_iata ON airports(iata);
CREATE INDEX IF NOT EXISTS idx_airports_country ON airports(country);
CREATE INDEX IF NOT EXISTS idx_airports_city ON airports(city);
CREATE INDEX IF NOT EXISTS idx_airports_embedding ON airports USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Airlines table
CREATE TABLE IF NOT EXISTS airlines (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  alias text,
  iata text,
  icao text,
  callsign text,
  country text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_airlines_iata ON airlines(iata);
CREATE INDEX IF NOT EXISTS idx_airlines_active ON airlines(active);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
  id bigserial PRIMARY KEY,
  airline_id bigint REFERENCES airlines(id),
  source_airport_id bigint REFERENCES airports(id),
  destination_airport_id bigint REFERENCES airports(id),
  codeshare boolean DEFAULT false,
  stops int DEFAULT 0,
  equipment text,
  popularity_score float DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routes_source ON routes(source_airport_id);
CREATE INDEX IF NOT EXISTS idx_routes_destination ON routes(destination_airport_id);
CREATE INDEX IF NOT EXISTS idx_routes_airline ON routes(airline_id);
CREATE INDEX IF NOT EXISTS idx_routes_popularity ON routes(popularity_score DESC);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  home_airport text,
  travel_preferences jsonb DEFAULT '{}',
  journeys_count int DEFAULT 0,
  countries_visited int DEFAULT 0,
  total_miles float DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Journeys table
CREATE TABLE IF NOT EXISTS journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  journey_type text DEFAULT 'solo',
  departure_date date,
  return_date date,
  legs jsonb NOT NULL DEFAULT '[]',
  keywords text[] DEFAULT '{}',
  ai_story text,
  similarity_score float DEFAULT 0,
  rarity_score float DEFAULT 50,
  cultural_insights jsonb DEFAULT '{}',
  embedding vector(384),
  visibility text DEFAULT 'public',
  likes_count int DEFAULT 0,
  views_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public journeys are viewable by everyone"
  ON journeys FOR SELECT
  USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users can insert own journeys"
  ON journeys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journeys"
  ON journeys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journeys"
  ON journeys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_journeys_user ON journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_journeys_visibility ON journeys(visibility);
CREATE INDEX IF NOT EXISTS idx_journeys_type ON journeys(journey_type);
CREATE INDEX IF NOT EXISTS idx_journeys_created ON journeys(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journeys_likes ON journeys(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_journeys_embedding ON journeys USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Journey memories table
CREATE TABLE IF NOT EXISTS journey_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid REFERENCES journeys(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type text DEFAULT 'note',
  content text NOT NULL,
  location text,
  captured_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE journey_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view memories of visible journeys"
  ON journey_memories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = journey_memories.journey_id
      AND (journeys.visibility = 'public' OR journeys.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own memories"
  ON journey_memories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories"
  ON journey_memories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories"
  ON journey_memories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_journey_memories_journey ON journey_memories(journey_id);

-- Cultural destinations table
CREATE TABLE IF NOT EXISTS cultural_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  country text NOT NULL,
  description text,
  highlights text[] DEFAULT '{}',
  best_season text,
  famous_for text[] DEFAULT '{}',
  historical_facts jsonb DEFAULT '{}',
  local_cuisine text[] DEFAULT '{}',
  travel_tips text[] DEFAULT '{}',
  embedding vector(384),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cultural_destinations_city ON cultural_destinations(city);
CREATE INDEX IF NOT EXISTS idx_cultural_destinations_country ON cultural_destinations(country);
CREATE INDEX IF NOT EXISTS idx_cultural_destinations_embedding ON cultural_destinations USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Journey analytics table
CREATE TABLE IF NOT EXISTS journey_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_pattern text UNIQUE NOT NULL,
  journey_count int DEFAULT 0,
  avg_duration int DEFAULT 0,
  popular_months int[] DEFAULT '{}',
  common_keywords text[] DEFAULT '{}',
  traveler_types jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journey_analytics_pattern ON journey_analytics(route_pattern);
CREATE INDEX IF NOT EXISTS idx_journey_analytics_count ON journey_analytics(journey_count DESC);

-- Journey likes table
CREATE TABLE IF NOT EXISTS journey_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid REFERENCES journeys(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(journey_id, user_id)
);

ALTER TABLE journey_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes"
  ON journey_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON journey_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON journey_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_journey_likes_journey ON journey_likes(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_likes_user ON journey_likes(user_id);

-- Journey comments table
CREATE TABLE IF NOT EXISTS journey_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid REFERENCES journeys(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE journey_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on visible journeys"
  ON journey_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = journey_comments.journey_id
      AND (journeys.visibility = 'public' OR journeys.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own comments"
  ON journey_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON journey_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON journey_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_journey_comments_journey ON journey_comments(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_comments_created ON journey_comments(created_at DESC);