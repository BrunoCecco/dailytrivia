/*
  # Social Features Schema

  1. New Tables
    - `user_activities`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `activity_type` (enum)
      - `content` (text)
      - `metadata` (jsonb)
      - `is_public` (boolean)
      - `created_at` (timestamp)

    - `activity_likes`
      - `id` (uuid, primary key)
      - `activity_id` (uuid, references user_activities)
      - `user_id` (uuid, references user_profiles)
      - `created_at` (timestamp)

    - `activity_comments`
      - `id` (uuid, primary key)
      - `activity_id` (uuid, references user_activities)
      - `user_id` (uuid, references user_profiles)
      - `content` (text)
      - `created_at` (timestamp)

    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `type` (enum)
      - `title` (text)
      - `message` (text)
      - `data` (jsonb)
      - `is_read` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for social interactions
*/

-- Create activity type enum
CREATE TYPE activity_type AS ENUM (
  'quiz_completed',
  'perfect_score',
  'streak_milestone',
  'league_joined',
  'achievement_unlocked',
  'friend_added',
  'trash_talk'
);

-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'friend_request',
  'friend_accepted',
  'quiz_reminder',
  'league_invitation',
  'achievement',
  'streak_warning',
  'league_position'
);

-- User Activities
CREATE TABLE IF NOT EXISTS user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Users can read public activities from friends
CREATE POLICY "Users can read friend activities"
  ON user_activities
  FOR SELECT
  TO authenticated
  USING (
    is_public = true AND (
      user_id = auth.uid() OR
      user_id IN (
        SELECT friend_id FROM user_friends WHERE status = 'accepted'
      )
    )
  );

-- Users can create their own activities
CREATE POLICY "Users can create own activities"
  ON user_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Activity Likes
CREATE TABLE IF NOT EXISTS activity_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES user_activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_activity_like UNIQUE (activity_id, user_id)
);

ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;

-- Users can read likes on activities they can see
CREATE POLICY "Users can read activity likes"
  ON activity_likes
  FOR SELECT
  TO authenticated
  USING (
    activity_id IN (
      SELECT id FROM user_activities 
      WHERE is_public = true AND (
        user_id = auth.uid() OR
        user_id IN (
          SELECT friend_id FROM user_friends WHERE status = 'accepted'
        )
      )
    )
  );

-- Users can like activities
CREATE POLICY "Users can like activities"
  ON activity_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike activities
CREATE POLICY "Users can unlike activities"
  ON activity_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Activity Comments
CREATE TABLE IF NOT EXISTS activity_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES user_activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

-- Users can read comments on activities they can see
CREATE POLICY "Users can read activity comments"
  ON activity_comments
  FOR SELECT
  TO authenticated
  USING (
    activity_id IN (
      SELECT id FROM user_activities 
      WHERE is_public = true AND (
        user_id = auth.uid() OR
        user_id IN (
          SELECT friend_id FROM user_friends WHERE status = 'accepted'
        )
      )
    )
  );

-- Users can comment on activities
CREATE POLICY "Users can comment on activities"
  ON activity_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON activity_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON activity_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- System can create notifications
CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to create activity when quiz is completed
CREATE OR REPLACE FUNCTION create_quiz_activity()
RETURNS trigger AS $$
BEGIN
  -- Create activity for quiz completion
  INSERT INTO user_activities (user_id, activity_type, content, metadata)
  VALUES (
    NEW.user_id,
    'quiz_completed',
    CASE 
      WHEN NEW.score = NEW.total_questions THEN 'Perfect score! 🎯'
      ELSE 'Completed today''s quiz'
    END,
    jsonb_build_object(
      'score', NEW.score,
      'total_questions', NEW.total_questions,
      'quiz_date', (SELECT quiz_date FROM daily_quizzes WHERE id = NEW.daily_quiz_id)
    )
  );
  
  -- Create perfect score activity if applicable
  IF NEW.score = NEW.total_questions THEN
    INSERT INTO user_activities (user_id, activity_type, content, metadata)
    VALUES (
      NEW.user_id,
      'perfect_score',
      'Nailed it with a perfect score! 🔥',
      jsonb_build_object(
        'score', NEW.score,
        'quiz_date', (SELECT quiz_date FROM daily_quizzes WHERE id = NEW.daily_quiz_id)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_quiz_activity
  AFTER INSERT ON user_quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION create_quiz_activity();

-- Function to create notification for friend requests
CREATE OR REPLACE FUNCTION create_friend_request_notification()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      NEW.addressee_id,
      'friend_request',
      'New Friend Request',
      up.display_name || ' wants to be your friend!',
      jsonb_build_object(
        'friendship_id', NEW.id,
        'requester_id', NEW.requester_id,
        'requester_username', up.username
      )
    FROM user_profiles up
    WHERE up.id = NEW.requester_id;
  ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      NEW.requester_id,
      'friend_accepted',
      'Friend Request Accepted',
      up.display_name || ' accepted your friend request!',
      jsonb_build_object(
        'friendship_id', NEW.id,
        'friend_id', NEW.addressee_id,
        'friend_username', up.username
      )
    FROM user_profiles up
    WHERE up.id = NEW.addressee_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_friendship_notification
  AFTER INSERT OR UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION create_friend_request_notification();