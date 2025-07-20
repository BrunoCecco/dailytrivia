/*
  # Quiz System Schema

  1. New Tables
    - `quiz_categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `icon` (text)
      - `color` (text)
      - `is_active` (boolean)

    - `daily_quizzes`
      - `id` (uuid, primary key)
      - `quiz_date` (date, unique)
      - `theme` (text)
      - `difficulty_level` (enum)
      - `is_active` (boolean)
      - `created_at` (timestamp)

    - `quiz_questions`
      - `id` (uuid, primary key)
      - `daily_quiz_id` (uuid, references daily_quizzes)
      - `category_id` (uuid, references quiz_categories)
      - `question_text` (text)
      - `question_order` (integer)
      - `difficulty` (enum)
      - `explanation` (text, optional)
      - `created_at` (timestamp)

    - `question_options`
      - `id` (uuid, primary key)
      - `question_id` (uuid, references quiz_questions)
      - `option_text` (text)
      - `option_order` (integer)
      - `is_correct` (boolean)

    - `user_quiz_attempts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `daily_quiz_id` (uuid, references daily_quizzes)
      - `score` (integer)
      - `total_questions` (integer)
      - `time_taken` (integer, seconds)
      - `completed_at` (timestamp)
      - `created_at` (timestamp)

    - `user_question_answers`
      - `id` (uuid, primary key)
      - `attempt_id` (uuid, references user_quiz_attempts)
      - `question_id` (uuid, references quiz_questions)
      - `selected_option_id` (uuid, references question_options)
      - `is_correct` (boolean)
      - `time_taken` (integer, seconds)
      - `answered_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for reading and writing
*/

-- Create difficulty enum
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- Quiz Categories
CREATE TABLE IF NOT EXISTS quiz_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  color text DEFAULT '#6366F1',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active categories"
  ON quiz_categories
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Daily Quizzes
CREATE TABLE IF NOT EXISTS daily_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_date date UNIQUE NOT NULL,
  theme text,
  difficulty_level difficulty_level DEFAULT 'medium',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active daily quizzes"
  ON daily_quizzes
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Quiz Questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_quiz_id uuid NOT NULL REFERENCES daily_quizzes(id) ON DELETE CASCADE,
  category_id uuid REFERENCES quiz_categories(id),
  question_text text NOT NULL,
  question_order integer NOT NULL,
  difficulty difficulty_level DEFAULT 'medium',
  explanation text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read quiz questions"
  ON quiz_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Question Options
CREATE TABLE IF NOT EXISTS question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  option_order integer NOT NULL,
  is_correct boolean DEFAULT false
);

ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read question options"
  ON question_options
  FOR SELECT
  TO authenticated
  USING (true);

-- User Quiz Attempts
CREATE TABLE IF NOT EXISTS user_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  daily_quiz_id uuid NOT NULL REFERENCES daily_quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 5,
  time_taken integer, -- in seconds
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  
  -- One attempt per user per day
  CONSTRAINT unique_daily_attempt UNIQUE (user_id, daily_quiz_id)
);

ALTER TABLE user_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quiz attempts"
  ON user_quiz_attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
  ON user_quiz_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read friends' quiz attempts"
  ON user_quiz_attempts
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT friend_id FROM user_friends WHERE status = 'accepted'
    )
  );

-- User Question Answers
CREATE TABLE IF NOT EXISTS user_question_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES user_quiz_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option_id uuid REFERENCES question_options(id),
  is_correct boolean DEFAULT false,
  time_taken integer, -- in seconds
  answered_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_question_answer UNIQUE (attempt_id, question_id)
);

ALTER TABLE user_question_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own question answers"
  ON user_question_answers
  FOR SELECT
  TO authenticated
  USING (
    attempt_id IN (
      SELECT id FROM user_quiz_attempts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own question answers"
  ON user_question_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    attempt_id IN (
      SELECT id FROM user_quiz_attempts WHERE user_id = auth.uid()
    )
  );

-- Insert sample categories
INSERT INTO quiz_categories (name, description, icon, color) VALUES
  ('Science', 'Questions about physics, chemistry, biology, and more', '🔬', '#10B981'),
  ('History', 'Historical events, figures, and civilizations', '📚', '#F59E0B'),
  ('Geography', 'Countries, capitals, landmarks, and natural features', '🌍', '#3B82F6'),
  ('Sports', 'Athletes, teams, records, and sporting events', '⚽', '#EF4444'),
  ('Entertainment', 'Movies, music, TV shows, and celebrities', '🎬', '#EC4899'),
  ('Literature', 'Books, authors, poetry, and literary works', '📖', '#8B5CF6'),
  ('Technology', 'Computing, internet, gadgets, and innovations', '💻', '#06B6D4'),
  ('Art', 'Paintings, sculptures, artists, and art movements', '🎨', '#F97316')
ON CONFLICT (name) DO NOTHING;