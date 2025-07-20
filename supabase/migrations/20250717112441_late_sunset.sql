/*
  # Friend Relationships Schema

  1. New Tables
    - `friendships`
      - `id` (uuid, primary key)
      - `requester_id` (uuid, references user_profiles)
      - `addressee_id` (uuid, references user_profiles)
      - `status` (enum: pending, accepted, declined, blocked)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `friendships` table
    - Add policies for users to manage their own friendships
    - Add unique constraint to prevent duplicate requests
*/

-- Create friendship status enum
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');

CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status friendship_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Prevent self-friendship and duplicate requests
  CONSTRAINT no_self_friendship CHECK (requester_id != addressee_id),
  CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Users can read friendships they're involved in
CREATE POLICY "Users can read own friendships"
  ON friendships
  FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can create friendship requests
CREATE POLICY "Users can create friendship requests"
  ON friendships
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Users can update friendships they're involved in
CREATE POLICY "Users can update own friendships"
  ON friendships
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can delete friendships they're involved in
CREATE POLICY "Users can delete own friendships"
  ON friendships
  FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Add updated_at trigger
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for easier friend queries
CREATE OR REPLACE VIEW user_friends AS
SELECT 
  f.id as friendship_id,
  CASE 
    WHEN f.requester_id = auth.uid() THEN f.addressee_id
    ELSE f.requester_id
  END as friend_id,
  CASE 
    WHEN f.requester_id = auth.uid() THEN up2.username
    ELSE up1.username
  END as friend_username,
  CASE 
    WHEN f.requester_id = auth.uid() THEN up2.display_name
    ELSE up1.display_name
  END as friend_display_name,
  CASE 
    WHEN f.requester_id = auth.uid() THEN up2.avatar_url
    ELSE up1.avatar_url
  END as friend_avatar_url,
  CASE 
    WHEN f.requester_id = auth.uid() THEN up2.current_streak
    ELSE up1.current_streak
  END as friend_streak,
  CASE 
    WHEN f.requester_id = auth.uid() THEN up2.total_points
    ELSE up1.total_points
  END as friend_points,
  f.status,
  f.created_at,
  f.updated_at
FROM friendships f
JOIN user_profiles up1 ON f.requester_id = up1.id
JOIN user_profiles up2 ON f.addressee_id = up2.id
WHERE (f.requester_id = auth.uid() OR f.addressee_id = auth.uid())
  AND f.status = 'accepted';