-- Fix for Journey Saving - Allow Anonymous Users
-- Run this SQL in Supabase SQL Editor if journeys aren't saving

-- Add policy to allow anonymous users to insert journeys
CREATE POLICY "Anonymous users can insert public journeys"
  ON journeys FOR INSERT
  TO anon
  WITH CHECK (visibility = 'public' AND user_id IS NULL);

-- Add policy to allow anonymous users to view all public journeys
CREATE POLICY "Anyone can view public journeys"
  ON journeys FOR SELECT
  TO anon
  USING (visibility = 'public');

-- Optional: If you want anonymous users to be able to update their journeys
-- (identified by user_id IS NULL), uncomment below:
-- CREATE POLICY "Anonymous can update their public journeys"
--   ON journeys FOR UPDATE
--   TO anon
--   USING (user_id IS NULL AND visibility = 'public')
--   WITH CHECK (user_id IS NULL AND visibility = 'public');
