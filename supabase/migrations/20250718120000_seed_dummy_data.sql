-- Dummy data seed for DailyTrivia
-- Run this in Supabase SQL editor or as a migration

-- 1. User Profiles
INSERT INTO user_profiles (id, username, display_name, avatar, created_at, total_points, current_streak, longest_streak, perfect_scores, total_quizzes)
VALUES
  ('e6d49548-8dc2-40e0-b19e-429807716871', 'sarah', 'Sarah Chen', '👩‍💻', NOW(), 2890, 15, 21, 5, 156),
  ('03c51f23-12b1-423c-ba0d-73c9daae692d', 'mike', 'Mike Johnson', '👨‍🔬', NOW(), 2756, 12, 18, 3, 140);

-- 2. Friendships
INSERT INTO friendships (id, requester_id, addressee_id, status, created_at)
VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'e6d49548-8dc2-40e0-b19e-429807716871', '03c51f23-12b1-423c-ba0d-73c9daae692d', 'accepted', NOW());

-- 3. Leagues
INSERT INTO leagues (id, name, description, creator_id, icon, is_private, max_members, is_active, created_at)
VALUES
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'College Friends', 'Trivia with college buddies', 'e6d49548-8dc2-40e0-b19e-429807716871', '🎓', false, 50, true, NOW()),
  ('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'Work Squad', 'Office trivia league', '03c51f23-12b1-423c-ba0d-73c9daae692d', '💼', false, 50, true, NOW());

-- 4. League Memberships
INSERT INTO league_memberships (id, league_id, user_id, is_active, joined_at)
VALUES
  ('ccccccc1-cccc-cccc-cccc-ccccccccccc1', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'e6d49548-8dc2-40e0-b19e-429807716871', true, NOW()),
  ('ccccccc2-cccc-cccc-cccc-ccccccccccc2', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '03c51f23-12b1-423c-ba0d-73c9daae692d', true, NOW()),
  ('ccccccc3-cccc-cccc-cccc-ccccccccccc3', 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '03c51f23-12b1-423c-ba0d-73c9daae692d', true, NOW());

-- 5. Quiz Categories
INSERT INTO quiz_categories (id, name, description)
VALUES
  ('ddddddd1-dddd-dddd-dddd-ddddddddddd1', 'General Knowledge', 'All-around trivia'),
  ('ddddddd2-dddd-dddd-dddd-ddddddddddd2', 'Science', 'Science and nature');

-- 6. Daily Quizzes
INSERT INTO daily_quizzes (id, quiz_date, is_active)
VALUES
  ('eeeeeee1-eeee-eeee-eeee-eeeeeeeeeee1', CURRENT_DATE, true);

-- 7. Quiz Questions
INSERT INTO quiz_questions (id, daily_quiz_id, category_id, question_text, question_order)
VALUES
  ('fffffff1-ffff-ffff-ffff-fffffffffff1', 'eeeeeee1-eeee-eeee-eeee-eeeeeeeeeee1', 'ddddddd1-dddd-dddd-dddd-ddddddddddd1', 'What is the capital of France?', 1),
  ('fffffff2-ffff-ffff-ffff-fffffffffff2', 'eeeeeee1-eeee-eeee-eeee-eeeeeeeeeee1', 'ddddddd2-dddd-dddd-dddd-ddddddddddd2', 'What planet is known as the Red Planet?', 2);

-- 8. Question Options
INSERT INTO question_options (id, question_id, answer_text, is_correct)
VALUES
  ('ggggggg1-gggg-gggg-gggg-ggggggggggg1', 'fffffff1-ffff-ffff-ffff-fffffffffff1', 'Paris', true),
  ('ggggggg2-gggg-gggg-gggg-ggggggggggg2', 'fffffff1-ffff-ffff-ffff-fffffffffff1', 'London', false),
  ('ggggggg3-gggg-gggg-gggg-ggggggggggg3', 'fffffff2-ffff-ffff-ffff-fffffffffff2', 'Mars', true),
  ('ggggggg4-gggg-gggg-gggg-ggggggggggg4', 'fffffff2-ffff-ffff-ffff-fffffffffff2', 'Jupiter', false);

-- 9. User Quiz Attempts
INSERT INTO user_quiz_attempts (id, user_id, daily_quiz_id, score, total_questions, time_taken, completed_at)
VALUES
  ('hhhhhhh1-hhhh-hhhh-hhhh-hhhhhhhhhhh1', 'e6d49548-8dc2-40e0-b19e-429807716871', 'eeeeeee1-eeee-eeee-eeee-eeeeeeeeeee1', 2, 2, 45, NOW());

-- 10. User Question Answers
INSERT INTO user_question_answers (id, attempt_id, question_id, selected_option_id, is_correct, time_taken, answered_at)
VALUES
  ('iiiiiii1-iiii-iiii-iiii-iiiiiiiiiii1', 'hhhhhhh1-hhhh-hhhh-hhhh-hhhhhhhhhhh1', 'fffffff1-ffff-ffff-ffff-fffffffffff1', 'ggggggg1-gggg-gggg-gggg-ggggggggggg1', true, 20, NOW()),
  ('iiiiiii2-iiii-iiii-iiii-iiiiiiiiiii2', 'hhhhhhh1-hhhh-hhhh-hhhh-hhhhhhhhhhh1', 'fffffff2-ffff-ffff-ffff-fffffffffff2', 'ggggggg3-gggg-gggg-gggg-ggggggggggg3', true, 25, NOW());

-- 11. User Activities (Social Feed)
INSERT INTO user_activities (id, user_id, activity_type, content, is_public, created_at)
VALUES
  ('jjjjjjj1-jjjj-jjjj-jjjj-jjjjjjjjjjj1', 'e6d49548-8dc2-40e0-b19e-429807716871', 'quiz_completed', 'Completed today''s quiz!', true, NOW()),
  ('jjjjjjj2-jjjj-jjjj-jjjj-jjjjjjjjjjj2', '03c51f23-12b1-423c-ba0d-73c9daae692d', 'trash_talk', 'Ready to lose your streak? 😏', true, NOW());

-- 12. Activity Likes & Comments
INSERT INTO activity_likes (id, activity_id, user_id, created_at)
VALUES
  ('kkkkkkk1-kkkk-kkkk-kkkk-kkkkkkkkkkk1', 'jjjjjjj1-jjjj-jjjj-jjjj-jjjjjjjjjjj1', '03c51f23-12b1-423c-ba0d-73c9daae692d', NOW());

INSERT INTO activity_comments (id, activity_id, user_id, content, created_at)
VALUES
  ('lllllll1-llll-llll-llll-lllllllllll1', 'jjjjjjj1-jjjj-jjjj-jjjj-jjjjjjjjjjj1', '03c51f23-12b1-423c-ba0d-73c9daae692d', 'Nice job!', NOW());

-- 13. Notifications
INSERT INTO notifications (id, user_id, type, data, is_read, created_at)
VALUES
  ('mmmmmmm1-mmmm-mmmm-mmmm-mmmmmmmmmmm1', 'e6d49548-8dc2-40e0-b19e-429807716871', 'friend_request', '{"from":"mike"}', false, NOW()); 