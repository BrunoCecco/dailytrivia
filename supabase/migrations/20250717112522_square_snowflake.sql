/*
  # Leagues and Competition System

  1. New Tables
    - `leagues`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `creator_id` (uuid, references user_profiles)
      - `icon` (text)
      - `is_private` (boolean)
      - `invite_code` (text, unique)
      - `max_members` (integer)
      - `season_start` (date)
      - `season_end` (date)
      - `is_active` (boolean)
      - `created_at` (timestamp)

    - `league_memberships`
      - `id` (uuid, primary key)
      - `league_id` (uuid, references leagues)
      - `user_id` (uuid, references user_profiles)
      - `joined_at` (timestamp)
      - `is_active` (boolean)

    - `league_leaderboards`
      - `id` (uuid, primary key)
      - `league_id` (uuid, references leagues)
      - `user_id` (uuid, references user_profiles)
      - `total_points` (integer)
      - `perfect_scores` (integer)
      - `current_streak` (integer)
      - `quizzes_completed` (integer)
      - `average_score` (decimal)
      - `last_updated` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for league management and participation
*/

CREATE TABLE IF NOT EXISTS leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  creator_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  icon text DEFAULT '🏆',
  is_private boolean DEFAULT false,
  invite_code text UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  max_members integer DEFAULT 50,
  season_start date DEFAULT CURRENT_DATE,
  season_end date DEFAULT (CURRENT_DATE + INTERVAL '3 months'),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

-- Anyone can read public leagues
CREATE POLICY "Anyone can read public leagues"
  ON leagues
  FOR SELECT
  TO authenticated
  USING (NOT is_private OR creator_id = auth.uid());

-- Users can create leagues
CREATE POLICY "Users can create leagues"
  ON leagues
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- League creators can update their leagues
CREATE POLICY "Creators can update own leagues"
  ON leagues
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

-- League Memberships
CREATE TABLE IF NOT EXISTS league_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  
  CONSTRAINT unique_league_membership UNIQUE (league_id, user_id)
);

ALTER TABLE league_memberships ENABLE ROW LEVEL SECURITY;

-- Users can read memberships for leagues they're in
CREATE POLICY "Users can read league memberships"
  ON league_memberships
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can join leagues
CREATE POLICY "Users can join leagues"
  ON league_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can leave leagues
CREATE POLICY "Users can update own memberships"
  ON league_memberships
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- League Leaderboards
CREATE TABLE IF NOT EXISTS league_leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  total_points integer DEFAULT 0,
  perfect_scores integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  quizzes_completed integer DEFAULT 0,
  average_score decimal(3,2) DEFAULT 0.00,
  last_updated timestamptz DEFAULT now(),
  
  CONSTRAINT unique_league_leaderboard UNIQUE (league_id, user_id)
);

ALTER TABLE league_leaderboards ENABLE ROW LEVEL SECURITY;

-- Users can read leaderboards for leagues they're in
CREATE POLICY "Users can read league leaderboards"
  ON league_leaderboards
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can update leaderboards
CREATE POLICY "System can update leaderboards"
  ON league_leaderboards
  FOR ALL
  TO authenticated
  USING (true);

-- Add updated_at trigger to leagues
CREATE TRIGGER update_leagues_updated_at
  BEFORE UPDATE ON leagues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically add creator to league
CREATE OR REPLACE FUNCTION add_creator_to_league()
RETURNS trigger AS $$
BEGIN
  INSERT INTO league_memberships (league_id, user_id)
  VALUES (NEW.id, NEW.creator_id);
  
  INSERT INTO league_leaderboards (league_id, user_id)
  VALUES (NEW.id, NEW.creator_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_league_created
  AFTER INSERT ON leagues
  FOR EACH ROW EXECUTE FUNCTION add_creator_to_league();

-- Function to update league leaderboard when user completes quiz
CREATE OR REPLACE FUNCTION update_league_leaderboard()
RETURNS trigger AS $$
BEGIN
  -- Update leaderboards for all leagues the user is in
  INSERT INTO league_leaderboards (league_id, user_id, total_points, perfect_scores, current_streak, quizzes_completed, average_score, last_updated)
  SELECT 
    lm.league_id,
    NEW.user_id,
    up.total_points,
    up.perfect_scores,
    up.current_streak,
    up.total_quizzes,
    CASE WHEN up.total_quizzes > 0 THEN up.total_points::decimal / up.total_quizzes ELSE 0 END,
    now()
  FROM league_memberships lm
  JOIN user_profiles up ON up.id = NEW.user_id
  WHERE lm.user_id = NEW.user_id AND lm.is_active = true
  ON CONFLICT (league_id, user_id) 
  DO UPDATE SET
    total_points = EXCLUDED.total_points,
    perfect_scores = EXCLUDED.perfect_scores,
    current_streak = EXCLUDED.current_streak,
    quizzes_completed = EXCLUDED.quizzes_completed,
    average_score = EXCLUDED.average_score,
    last_updated = EXCLUDED.last_updated;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_quiz_completed
  AFTER INSERT ON user_quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION update_league_leaderboard();