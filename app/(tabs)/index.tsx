import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuiz } from '@/hooks/useQuiz';
import { useAuth } from '@/hooks/useAuth';
import { TriviaQuestion } from '@/components/TriviaQuestion';
import { DailyProgress } from '@/components/DailyProgress';
import { StreakCounter } from '@/components/StreakCounter';
import { TomorrowPreview } from '@/components/TomorrowPreview';
import { UsersAPI } from '@/lib/api/users';
import { CheckCircle, Trophy, Clock, ArrowRight } from 'lucide-react-native';

export default function HomeTab() {
  const { user } = useAuth();
  const {
    todaysQuiz,
    questions,
    userAttempt,
    loading,
    submitting,
    hasCompletedToday,
    isQuizAvailable,
    submitQuiz,
    refreshQuiz,
  } = useQuiz();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: string]: number;
  }>({});
  const [userProfile, setUserProfile] = useState<any>(null);

  React.useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const profile = await UsersAPI.getCurrentUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleAnswer = (questionId: string, answerIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!todaysQuiz || questions.length === 0) return;

    const submission = {
      answers: questions.map((question) => ({
        questionId: question.id,
        selectedOptionId:
          question.options[selectedAnswers[question.id] || 0].id,
        timeTaken: 0, // TODO: Add timer functionality
      })),
      totalTimeTaken: 0, // TODO: Add timer functionality
    };

    try {
      await submitQuiz(submission);
      await loadUserProfile(); // Refresh user stats
      Alert.alert(
        'Quiz Completed!',
        'Great job! Your results have been saved.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
    }
  };

  const canSubmit =
    questions.length > 0 &&
    Object.keys(selectedAnswers).length === questions.length;

  if (loading) {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading today's quiz...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {userProfile?.display_name
              ? `Hello, ${userProfile.display_name}!`
              : 'Welcome back!'}
          </Text>
          {userProfile && (
            <View style={styles.statsRow}>
              <StreakCounter streak={userProfile.current_streak || 0} />
              <View style={styles.statCard}>
                <Trophy size={20} color="#F59E0B" />
                <Text style={styles.statValue}>
                  {userProfile.total_points || 0}
                </Text>
                <Text style={styles.statLabel}>Total Points</Text>
              </View>
            </View>
          )}
        </View>

        {hasCompletedToday && userAttempt && (
          <View style={styles.completedCard}>
            <View style={styles.completedHeader}>
              <CheckCircle size={24} color="#10B981" />
              <Text style={styles.completedTitle}>Today's Quiz Completed!</Text>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>
                {userAttempt.score}/{userAttempt.total_questions}
              </Text>
              <Text style={styles.scoreLabel}>Correct Answers</Text>
            </View>
            <View style={styles.scoreDetails}>
              <View style={styles.scoreDetail}>
                <Clock size={16} color="#9CA3AF" />
                <Text style={styles.scoreDetailText}>
                  {userAttempt.time_taken
                    ? `${Math.round(userAttempt.time_taken / 60)}m`
                    : 'N/A'}
                </Text>
              </View>
              <View style={styles.scoreDetail}>
                <Trophy size={16} color="#F59E0B" />
                <Text style={styles.scoreDetailText}>
                  +{userAttempt.score} points
                </Text>
              </View>
            </View>
          </View>
        )}

        {isQuizAvailable && questions.length > 0 && (
          <View style={styles.quizContainer}>
            <View style={styles.quizHeader}>
              <Text style={styles.quizTitle}>Today's Quiz</Text>
              <DailyProgress
                current={currentQuestionIndex + 1}
                total={questions.length}
              />
            </View>

            <View style={styles.questionContainer}>
              <TriviaQuestion
                question={questions[currentQuestionIndex]}
                onAnswer={(answerIndex) =>
                  handleAnswer(questions[currentQuestionIndex].id, answerIndex)
                }
                selectedAnswer={
                  selectedAnswers[questions[currentQuestionIndex].id] || null
                }
              />
            </View>

            <View style={styles.navigationContainer}>
              {currentQuestionIndex > 0 && (
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => setCurrentQuestionIndex((prev) => prev - 1)}
                >
                  <Text style={styles.navButtonText}>Previous</Text>
                </TouchableOpacity>
              )}

              {currentQuestionIndex < questions.length - 1 ? (
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    styles.primaryButton,
                    !selectedAnswers[questions[currentQuestionIndex].id] &&
                      styles.disabledButton,
                  ]}
                  onPress={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  disabled={
                    !selectedAnswers[questions[currentQuestionIndex].id]
                  }
                >
                  <Text style={styles.primaryButtonText}>Next</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    styles.primaryButton,
                    !canSubmit && styles.disabledButton,
                  ]}
                  onPress={handleSubmitQuiz}
                  disabled={!canSubmit || submitting}
                >
                  <Text style={styles.primaryButtonText}>
                    {submitting ? 'Submitting...' : 'Submit Quiz'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {!isQuizAvailable && !hasCompletedToday && (
          <View style={styles.noQuizCard}>
            <Text style={styles.noQuizTitle}>No Quiz Available</Text>
            <Text style={styles.noQuizText}>
              Check back tomorrow for a new daily quiz!
            </Text>
          </View>
        )}

        <TomorrowPreview />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#E5E7EB',
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    color: '#E5E7EB',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  statValue: {
    color: '#F59E0B',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  completedCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  completedTitle: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreText: {
    color: '#10B981',
    fontSize: 32,
    fontWeight: '700',
  },
  scoreLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  scoreDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreDetailText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
  },
  quizContainer: {
    backgroundColor: '#1F2937',
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  quizHeader: {
    marginBottom: 20,
  },
  quizTitle: {
    color: '#E5E7EB',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  questionContainer: {
    marginBottom: 24,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#4B5563',
    opacity: 0.5,
  },
  navButtonText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noQuizCard: {
    backgroundColor: '#1F2937',
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  noQuizTitle: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  noQuizText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
});
