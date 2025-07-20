/*
  # Sample Data for Testing

  This migration creates sample quiz data for testing the application.
  It includes a daily quiz with 5 questions across different categories.
*/

-- Insert today's daily quiz
INSERT INTO daily_quizzes (quiz_date, theme, difficulty_level) 
VALUES (CURRENT_DATE, 'Mixed Knowledge Challenge', 'medium')
ON CONFLICT (quiz_date) DO NOTHING;

-- Get today's quiz ID
DO $$
DECLARE
  quiz_id uuid;
  science_cat_id uuid;
  history_cat_id uuid;
  geography_cat_id uuid;
  entertainment_cat_id uuid;
  sports_cat_id uuid;
BEGIN
  -- Get quiz and category IDs
  SELECT id INTO quiz_id FROM daily_quizzes WHERE quiz_date = CURRENT_DATE;
  SELECT id INTO science_cat_id FROM quiz_categories WHERE name = 'Science';
  SELECT id INTO history_cat_id FROM quiz_categories WHERE name = 'History';
  SELECT id INTO geography_cat_id FROM quiz_categories WHERE name = 'Geography';
  SELECT id INTO entertainment_cat_id FROM quiz_categories WHERE name = 'Entertainment';
  SELECT id INTO sports_cat_id FROM quiz_categories WHERE name = 'Sports';

  -- Question 1: Science (Easy)
  INSERT INTO quiz_questions (daily_quiz_id, category_id, question_text, question_order, difficulty, explanation)
  VALUES (
    quiz_id,
    science_cat_id,
    'Which planet is known as the "Red Planet"?',
    1,
    'easy',
    'Mars is called the Red Planet because of iron oxide (rust) on its surface, giving it a reddish appearance.'
  );

  -- Question 1 Options
  INSERT INTO question_options (question_id, option_text, option_order, is_correct)
  SELECT 
    q.id,
    unnest(ARRAY['Venus', 'Mars', 'Jupiter', 'Saturn']),
    unnest(ARRAY[1, 2, 3, 4]),
    unnest(ARRAY[false, true, false, false])
  FROM quiz_questions q 
  WHERE q.daily_quiz_id = quiz_id AND q.question_order = 1;

  -- Question 2: History (Medium)
  INSERT INTO quiz_questions (daily_quiz_id, category_id, question_text, question_order, difficulty, explanation)
  VALUES (
    quiz_id,
    history_cat_id,
    'In which year did the Berlin Wall fall?',
    2,
    'medium',
    'The Berlin Wall fell on November 9, 1989, marking a pivotal moment in the end of the Cold War.'
  );

  -- Question 2 Options
  INSERT INTO question_options (question_id, option_text, option_order, is_correct)
  SELECT 
    q.id,
    unnest(ARRAY['1987', '1989', '1991', '1993']),
    unnest(ARRAY[1, 2, 3, 4]),
    unnest(ARRAY[false, true, false, false])
  FROM quiz_questions q 
  WHERE q.daily_quiz_id = quiz_id AND q.question_order = 2;

  -- Question 3: Geography (Medium)
  INSERT INTO quiz_questions (daily_quiz_id, category_id, question_text, question_order, difficulty, explanation)
  VALUES (
    quiz_id,
    geography_cat_id,
    'What is the capital city of Australia?',
    3,
    'medium',
    'Canberra is the capital of Australia, not Sydney or Melbourne as many people think.'
  );

  -- Question 3 Options
  INSERT INTO question_options (question_id, option_text, option_order, is_correct)
  SELECT 
    q.id,
    unnest(ARRAY['Sydney', 'Melbourne', 'Canberra', 'Perth']),
    unnest(ARRAY[1, 2, 3, 4]),
    unnest(ARRAY[false, false, true, false])
  FROM quiz_questions q 
  WHERE q.daily_quiz_id = quiz_id AND q.question_order = 3;

  -- Question 4: Entertainment (Hard)
  INSERT INTO quiz_questions (daily_quiz_id, category_id, question_text, question_order, difficulty, explanation)
  VALUES (
    quiz_id,
    entertainment_cat_id,
    'Who directed the movie "Pulp Fiction"?',
    4,
    'hard',
    'Quentin Tarantino directed Pulp Fiction (1994), which won the Palme d''Or at Cannes and the Academy Award for Best Original Screenplay.'
  );

  -- Question 4 Options
  INSERT INTO question_options (question_id, option_text, option_order, is_correct)
  SELECT 
    q.id,
    unnest(ARRAY['Martin Scorsese', 'Quentin Tarantino', 'Steven Spielberg', 'Christopher Nolan']),
    unnest(ARRAY[1, 2, 3, 4]),
    unnest(ARRAY[false, true, false, false])
  FROM quiz_questions q 
  WHERE q.daily_quiz_id = quiz_id AND q.question_order = 4;

  -- Question 5: Sports (Easy)
  INSERT INTO quiz_questions (daily_quiz_id, category_id, question_text, question_order, difficulty, explanation)
  VALUES (
    quiz_id,
    sports_cat_id,
    'How many players are on a basketball team on the court at one time?',
    5,
    'easy',
    'Each basketball team has 5 players on the court at any given time during play.'
  );

  -- Question 5 Options
  INSERT INTO question_options (question_id, option_text, option_order, is_correct)
  SELECT 
    q.id,
    unnest(ARRAY['4', '5', '6', '7']),
    unnest(ARRAY[1, 2, 3, 4]),
    unnest(ARRAY[false, true, false, false])
  FROM quiz_questions q 
  WHERE q.daily_quiz_id = quiz_id AND q.question_order = 5;

END $$;