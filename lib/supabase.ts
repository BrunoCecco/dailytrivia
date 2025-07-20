import { createClient, processLock } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

// Database types
export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  level: number;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  perfect_scores: number;
  total_quizzes: number;
  created_at: string;
  updated_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface UserFriend {
  friendship_id: string;
  friend_id: string;
  friend_username: string;
  friend_display_name: string;
  friend_avatar_url?: string;
  friend_streak: number;
  friend_points: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface QuizCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface DailyQuiz {
  id: string;
  quiz_date: string;
  theme?: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  is_active: boolean;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  daily_quiz_id: string;
  category_id?: string;
  question_text: string;
  question_order: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
  created_at: string;
  category?: QuizCategory;
  options: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  option_order: number;
  is_correct: boolean;
}

export interface UserQuizAttempt {
  id: string;
  user_id: string;
  daily_quiz_id: string;
  score: number;
  total_questions: number;
  time_taken?: number;
  completed_at: string;
  created_at: string;
}

export interface UserQuestionAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id?: string;
  is_correct: boolean;
  time_taken?: number;
  answered_at: string;
}

export interface League {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  icon: string;
  is_private: boolean;
  invite_code: string;
  max_members: number;
  season_start: string;
  season_end: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeagueMembership {
  id: string;
  league_id: string;
  user_id: string;
  joined_at: string;
  is_active: boolean;
}

export interface LeagueLeaderboard {
  id: string;
  league_id: string;
  user_id: string;
  total_points: number;
  perfect_scores: number;
  current_streak: number;
  quizzes_completed: number;
  average_score: number;
  last_updated: string;
  user_profile?: UserProfile;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type:
    | 'quiz_completed'
    | 'perfect_score'
    | 'streak_milestone'
    | 'league_joined'
    | 'achievement_unlocked'
    | 'friend_added'
    | 'trash_talk';
  content: string;
  metadata: any;
  is_public: boolean;
  created_at: string;
  user_profile?: UserProfile;
  likes_count?: number;
  comments_count?: number;
  user_liked?: boolean;
}

export interface ActivityLike {
  id: string;
  activity_id: string;
  user_id: string;
  created_at: string;
}

export interface ActivityComment {
  id: string;
  activity_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_profile?: UserProfile;
}

export interface Notification {
  id: string;
  user_id: string;
  type:
    | 'friend_request'
    | 'friend_accepted'
    | 'quiz_reminder'
    | 'league_invitation'
    | 'achievement'
    | 'streak_warning'
    | 'league_position';
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}
