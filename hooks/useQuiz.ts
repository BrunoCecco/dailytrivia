import { useState, useEffect } from 'react';
import { QuizAPI, QuizSubmission } from '@/lib/api/quiz';
import { DailyQuiz, QuizQuestion, UserQuizAttempt } from '@/lib/supabase';

export function useQuiz() {
  const [todaysQuiz, setTodaysQuiz] = useState<DailyQuiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAttempt, setUserAttempt] = useState<UserQuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTodaysQuiz();
  }, []);

  const loadTodaysQuiz = async () => {
    try {
      setLoading(true);
      console.log('Todays Quiz: loading');
      const quiz = await QuizAPI.getTodaysQuiz();
      setTodaysQuiz(quiz);
      console.log('Todays Quiz:', quiz);

      if (quiz) {
        const [quizQuestions, attempt] = await Promise.all([
          QuizAPI.getQuizQuestions(quiz.id),
          QuizAPI.getUserQuizAttempt(quiz.id),
        ]);

        setQuestions(quizQuestions);
        setUserAttempt(attempt);
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async (submission: QuizSubmission) => {
    if (!todaysQuiz) throw new Error('No quiz available');

    try {
      setSubmitting(true);
      const attempt = await QuizAPI.submitQuiz(todaysQuiz.id, submission);
      setUserAttempt(attempt);
      return attempt;
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const hasCompletedToday = !!userAttempt;
  const isQuizAvailable = !!todaysQuiz && !hasCompletedToday;

  return {
    todaysQuiz,
    questions,
    userAttempt,
    loading,
    submitting,
    hasCompletedToday,
    isQuizAvailable,
    submitQuiz,
    refreshQuiz: loadTodaysQuiz,
  };
}
