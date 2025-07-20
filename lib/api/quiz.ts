import {
  supabase,
  DailyQuiz,
  QuizQuestion,
  UserQuizAttempt,
  UserQuestionAnswer,
} from '../supabase';

export interface QuizSubmission {
  answers: {
    questionId: string;
    selectedOptionId: string;
    timeTaken?: number;
  }[];
  totalTimeTaken?: number;
}

export class QuizAPI {
  static async getTodaysQuiz(): Promise<DailyQuiz | null> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_quizzes')
      .select('*')
      .eq('quiz_date', today)
      .eq('is_active', true)
      .single();

    console.log('Quiz data:', data, 'Error:', error);

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select(
        `
        *,
        category:quiz_categories(*),
        options:question_options(*)
      `
      )
      .eq('daily_quiz_id', quizId)
      .order('question_order');

    if (error) throw error;
    return data || [];
  }

  static async getUserQuizAttempt(
    quizId: string
  ): Promise<UserQuizAttempt | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_quiz_attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('daily_quiz_id', quizId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async submitQuiz(
    quizId: string,
    submission: QuizSubmission
  ): Promise<UserQuizAttempt> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user already completed this quiz
    const existingAttempt = await this.getUserQuizAttempt(quizId);
    if (existingAttempt) {
      throw new Error('Quiz already completed for today');
    }

    // Get quiz questions to calculate score
    const questions = await this.getQuizQuestions(quizId);
    let score = 0;

    // Calculate score
    for (const answer of submission.answers) {
      const question = questions.find((q) => q.id === answer.questionId);
      if (question) {
        const correctOption = question.options.find((opt) => opt.is_correct);
        if (correctOption && correctOption.id === answer.selectedOptionId) {
          score++;
        }
      }
    }

    // Create quiz attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('user_quiz_attempts')
      .insert({
        user_id: user.id,
        daily_quiz_id: quizId,
        score,
        total_questions: questions.length,
        time_taken: submission.totalTimeTaken,
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    // Save individual answers
    const answerInserts = submission.answers.map((answer) => {
      const question = questions.find((q) => q.id === answer.questionId);
      const correctOption = question?.options.find((opt) => opt.is_correct);
      const isCorrect = correctOption?.id === answer.selectedOptionId;

      return {
        attempt_id: attempt.id,
        question_id: answer.questionId,
        selected_option_id: answer.selectedOptionId,
        is_correct: isCorrect,
        time_taken: answer.timeTaken,
      };
    });

    const { error: answersError } = await supabase
      .from('user_question_answers')
      .insert(answerInserts);

    if (answersError) throw answersError;

    // Update user stats
    await this.updateUserStats(user.id, score, questions.length);

    return attempt;
  }

  private static async updateUserStats(
    userId: string,
    score: number,
    totalQuestions: number
  ) {
    // Get current user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const isPerfectScore = score === totalQuestions;
    const newTotalQuizzes = profile.total_quizzes + 1;
    const newTotalPoints = profile.total_points + score;
    const newPerfectScores = profile.perfect_scores + (isPerfectScore ? 1 : 0);

    // Calculate streak
    let newCurrentStreak = profile.current_streak;
    let newLongestStreak = profile.longest_streak;

    if (score > 0) {
      newCurrentStreak += 1;
      newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
    } else {
      newCurrentStreak = 0;
    }

    // Update user profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        total_points: newTotalPoints,
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        perfect_scores: newPerfectScores,
        total_quizzes: newTotalQuizzes,
      })
      .eq('id', userId);

    if (updateError) throw updateError;
  }

  static async getQuizHistory(limit: number = 10): Promise<UserQuizAttempt[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_quiz_attempts')
      .select(
        `
        *,
        daily_quiz:daily_quizzes(*)
      `
      )
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async getQuizAnswers(
    attemptId: string
  ): Promise<UserQuestionAnswer[]> {
    const { data, error } = await supabase
      .from('user_question_answers')
      .select(
        `
        *,
        question:quiz_questions(*),
        selected_option:question_options(*)
      `
      )
      .eq('attempt_id', attemptId)
      .order('answered_at');

    if (error) throw error;
    return data || [];
  }
}
