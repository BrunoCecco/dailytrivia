-- Mock Data for DailyTrivia: All Tables, 7 Days of Quizzes
-- Run this after schema migrations

-- 1. Users
INSERT INTO user_profiles (id, email, username, display_name, avatar_url)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'alice@example.com', 'alice', 'Alice', '👩'),
  ('00000000-0000-0000-0000-000000000002', 'bob@example.com', 'bob', 'Bob', '👨'),
  ('00000000-0000-0000-0000-000000000003', 'carol@example.com', 'carol', 'Carol', '👩‍🦰')
ON CONFLICT (id) DO NOTHING;

-- 2. Friendships
INSERT INTO friendships (id, requester_id, addressee_id, status)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'accepted'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'accepted')
ON CONFLICT (id) DO NOTHING;

-- 3. Quiz Categories (if not already present)
INSERT INTO quiz_categories (id, name, description, icon, color)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'Science', 'Science trivia', '🔬', '#10B981'),
  ('20000000-0000-0000-0000-000000000002', 'History', 'History trivia', '📚', '#F59E0B'),
  ('20000000-0000-0000-0000-000000000003', 'Geography', 'Geography trivia', '🌍', '#3B82F6'),
  ('20000000-0000-0000-0000-000000000004', 'Sports', 'Sports trivia', '⚽', '#EF4444'),
  ('20000000-0000-0000-0000-000000000005', 'Entertainment', 'Entertainment trivia', '🎬', '#EC4899'),
  ('20000000-0000-0000-0000-000000000006', 'Literature', 'Literature trivia', '📖', '#8B5CF6'),
  ('20000000-0000-0000-0000-000000000007', 'Technology', 'Tech trivia', '💻', '#06B6D4'),
  ('20000000-0000-0000-0000-000000000008', 'Art', 'Art trivia', '🎨', '#F97316')
ON CONFLICT (id) DO NOTHING;

-- 4. Leagues
INSERT INTO leagues (id, name, description, creator_id, icon)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'Trivia Masters', 'Elite trivia league', '00000000-0000-0000-0000-000000000001', '🏆'),
  ('30000000-0000-0000-0000-000000000002', 'Casual Quizzers', 'Just for fun', '00000000-0000-0000-0000-000000000002', '🎲')
ON CONFLICT (id) DO NOTHING;

-- 5. League Memberships
INSERT INTO league_memberships (id, league_id, user_id)
VALUES
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- 6. Daily Quizzes for the next 7 days, with questions and options
DO $$
DECLARE
  i integer;
  quiz_id uuid;
  cat_ids uuid[] := ARRAY[
    '20000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000005'
  ];
  cat_names text[] := ARRAY[
    'Science', 'History', 'Geography', 'Sports', 'Entertainment'
  ];
  qid uuid;
  qtext text;
  opt_id uuid;
  opt_texts text[] := ARRAY['Option A', 'Option B', 'Option C', 'Option D'];
  correct_idx integer;
BEGIN
  FOR i IN 0..6 LOOP
    -- Insert daily quiz
    INSERT INTO daily_quizzes (quiz_date, theme, difficulty_level)
    VALUES (CURRENT_DATE + i, 'Theme ' || (i+1), 'medium')
    ON CONFLICT (quiz_date) DO NOTHING
    RETURNING id INTO quiz_id;

    -- 5 questions per quiz
    FOR q IN 1..5 LOOP
      qtext := 'Question ' || q || ' for ' || cat_names[q] || ' on day ' || (i+1);
      INSERT INTO quiz_questions (daily_quiz_id, category_id, question_text, question_order, difficulty)
      VALUES (quiz_id, cat_ids[q], qtext, q, CASE WHEN q=1 OR q=5 THEN 'easy' WHEN q=2 OR q=3 THEN 'medium' ELSE 'hard' END)
      RETURNING id INTO qid;

      -- 4 options per question, 1 correct (randomly chosen)
      correct_idx := 1 + (random()*3)::integer;
      FOR o IN 1..4 LOOP
        INSERT INTO question_options (question_id, option_text, option_order, is_correct)
        VALUES (
          qid,
          opt_texts[o] || ' for Q' || q || 'D' || (i+1),
          o,
          o = correct_idx
        );
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- 7. User Quiz Attempts and Answers (each user attempts each quiz)
DO $$
DECLARE
  quiz_rec RECORD;
  user_rec RECORD;
  q_rec RECORD;
  opt_rec RECORD;
  attempt_id uuid;
  is_correct boolean;
  selected_opt_id uuid;
  score integer;
BEGIN
  FOR quiz_rec IN SELECT id, quiz_date FROM daily_quizzes WHERE quiz_date >= CURRENT_DATE AND quiz_date < CURRENT_DATE + 7 LOOP
    FOR user_rec IN SELECT id FROM user_profiles LOOP
      score := 0;
      INSERT INTO user_quiz_attempts (user_id, daily_quiz_id, score, total_questions, time_taken, completed_at)
      VALUES (user_rec.id, quiz_rec.id, 0, 5, 30 + (random()*60)::integer, quiz_rec.quiz_date + interval '12 hours')
      RETURNING id INTO attempt_id;

      FOR q_rec IN SELECT id FROM quiz_questions WHERE daily_quiz_id = quiz_rec.id LOOP
        -- Pick a random option, 50% chance to be correct
        SELECT id, is_correct INTO opt_rec FROM question_options WHERE question_id = q_rec.id ORDER BY random() LIMIT 1;
        is_correct := opt_rec.is_correct;
        selected_opt_id := opt_rec.id;
        IF is_correct THEN
          score := score + 1;
        END IF;
        INSERT INTO user_question_answers (attempt_id, question_id, selected_option_id, is_correct, time_taken, answered_at)
        VALUES (attempt_id, q_rec.id, selected_opt_id, is_correct, 5 + (random()*10)::integer, quiz_rec.quiz_date + interval '12 hours');
      END LOOP;
      -- Update score
      UPDATE user_quiz_attempts SET score = score WHERE id = attempt_id;
    END LOOP;
  END LOOP;
END $$;

-- 8. Social Activities
INSERT INTO user_activities (id, user_id, activity_type, content, is_public)
VALUES
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'quiz_completed', 'Alice completed today''s quiz!', true),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'perfect_score', 'Bob got a perfect score!', true),
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'streak_milestone', 'Carol reached a 10-day streak!', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Activity Likes
INSERT INTO activity_likes (id, activity_id, user_id)
VALUES
  ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- 10. Activity Comments
INSERT INTO activity_comments (id, activity_id, user_id, content)
VALUES
  ('70000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Nice job Alice!'),
  ('70000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Congrats Bob!')
ON CONFLICT (id) DO NOTHING;

-- 11. Notifications
INSERT INTO notifications (id, user_id, type, title, message, is_read)
VALUES
  ('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'friend_request', 'New Friend Request', 'Bob wants to be your friend!', false),
  ('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'quiz_reminder', 'Quiz Reminder', 'Don''t forget today''s quiz!', false)
ON CONFLICT (id) DO NOTHING; 