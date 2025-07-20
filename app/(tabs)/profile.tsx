import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Trophy,
  Flame,
  Star,
  Award,
  Calendar,
  Target,
  Zap,
  Crown,
  Medal,
  Shield,
  ChevronRight,
} from 'lucide-react-native';
import { UsersAPI } from '@/lib/api/users';
import { QuizAPI } from '@/lib/api/quiz';
import { useAuth } from '@/hooks/useAuth';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const [stats, setStats] = useState<any>({});
  const [achievements, setAchievements] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [quizHistory, setQuizHistory] = useState<any[]>([]);

  const { user, session, profile, signIn, signOut } = useAuth();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats({
        totalQuizzes: profile?.total_quizzes || 0,
        perfectScores: profile?.perfect_scores || 0,
        currentStreak: profile?.current_streak || 0,
        longestStreak: profile?.longest_streak || 0,
        totalPoints: profile?.total_points || 0,
        // Removed averageScore, rank, correctAnswers
      });
      // Fetch quiz history for weekly data
      const history = await QuizAPI.getQuizHistory(7);
      setQuizHistory(history);
      setWeeklyData(
        history.map((attempt: any) => ({
          day: new Date(attempt.completed_at).toLocaleDateString('en-US', {
            weekday: 'short',
          }),
          score: attempt.score,
        }))
      );
      // Achievements (mocked for now, can be fetched from backend if available)
      setAchievements([
        {
          id: 1,
          name: 'Perfect Week',
          description: 'Score 5/5 for 7 days straight',
          icon: Crown,
          color: '#F59E0B',
          unlocked: (profile?.longest_streak ?? 0) >= 7,
          date: (profile?.longest_streak ?? 0) >= 7 ? '2024-01-15' : undefined,
        },
        {
          id: 2,
          name: 'Streak Master',
          description: 'Maintain a 14-day streak',
          icon: Flame,
          color: '#EF4444',
          unlocked: (profile?.longest_streak ?? 0) >= 14,
          date: (profile?.longest_streak ?? 0) >= 14 ? '2024-01-10' : undefined,
        },
        {
          id: 3,
          name: 'League Champion',
          description: 'Finish #1 in a league',
          icon: Trophy,
          color: '#EC4899',
          unlocked: false,
        },
        // Removed Knowledge Seeker achievement (correct_answers)
        {
          id: 5,
          name: 'Social Butterfly',
          description: 'Add 10 friends',
          icon: Award,
          color: '#6366F1',
          unlocked: false,
          progress: 7,
        },
        {
          id: 6,
          name: 'Lightning Fast',
          description: 'Answer in under 5 seconds',
          icon: Zap,
          color: '#F59E0B',
          unlocked: false,
          progress: 3,
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const renderStatCard = (
    title: string,
    value: string | number,
    icon: any,
    color: string
  ) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        {React.createElement(icon, { size: 24, color })}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const renderAchievement = (achievement: any) => (
    <View
      key={achievement.id}
      style={[
        styles.achievementCard,
        !achievement.unlocked && styles.lockedAchievement,
      ]}
    >
      <View
        style={[
          styles.achievementIcon,
          { backgroundColor: `${achievement.color}20` },
        ]}
      >
        {React.createElement(achievement.icon, {
          size: 24,
          color: achievement.unlocked ? achievement.color : '#6B7280',
        })}
      </View>
      <View style={styles.achievementContent}>
        <Text
          style={[
            styles.achievementName,
            !achievement.unlocked && styles.lockedText,
          ]}
        >
          {achievement.name}
        </Text>
        <Text style={styles.achievementDescription}>
          {achievement.description}
        </Text>
        {achievement.unlocked ? (
          <Text style={styles.achievementDate}>
            Unlocked {achievement.date}
          </Text>
        ) : (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(achievement.progress / 10) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {achievement.progress || 0}/10
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#111827',
        }}
      >
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#111827',
        }}
      >
        <Text style={{ color: '#EF4444', fontSize: 16 }}>{error}</Text>
        <TouchableOpacity onPress={signOut} style={{ marginTop: 16 }}>
          <Text style={{ color: '#6366F1' }}>Sign Out</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={fetchProfile} style={{ marginTop: 16 }}>
          <Text style={{ color: '#6366F1' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.header}>
        <TouchableOpacity
          onPress={signOut}
          style={{ position: 'absolute', top: 60, right: 20 }}
        >
          <Text style={{ color: '#6366F1' }}>Sign Out</Text>
        </TouchableOpacity>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <User size={40} color="#6366F1" />
          </View>
          <Text style={styles.username}>
            {profile?.username || 'TriviaChamp'}
          </Text>
          <Text style={styles.userLevel}>
            Level {profile?.level || 1} •{' '}
            {profile?.display_name || 'Trivia Master'}
          </Text>
          <View style={styles.rankBadge}>
            <Medal size={16} color="#F59E0B" />
            <Text style={styles.rankText}>Global Rank #{stats.rank}</Text>
          </View>
        </View>
      </LinearGradient>
      <View style={styles.content}>
        <View style={styles.statsGrid}>
          {renderStatCard('Total Points', stats.totalPoints, Trophy, '#F59E0B')}
          {renderStatCard(
            'Current Streak',
            stats.currentStreak,
            Flame,
            '#EF4444'
          )}
          {renderStatCard(
            'Perfect Scores',
            stats.perfectScores,
            Star,
            '#EC4899'
          )}
          {renderStatCard('Avg Score', stats.averageScore, Target, '#10B981')}
        </View>
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Weekly Performance</Text>
            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'week' && styles.activePeriod,
                ]}
                onPress={() => setSelectedPeriod('week')}
              >
                <Text
                  style={[
                    styles.periodText,
                    selectedPeriod === 'week' && styles.activePeriodText,
                  ]}
                >
                  Week
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'month' && styles.activePeriod,
                ]}
                onPress={() => setSelectedPeriod('month')}
              >
                <Text
                  style={[
                    styles.periodText,
                    selectedPeriod === 'month' && styles.activePeriodText,
                  ]}
                >
                  Month
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.chart}>
            {weeklyData.map((day, index) => (
              <View key={index} style={styles.chartDay}>
                <View style={styles.chartBar}>
                  <View
                    style={[
                      styles.chartFill,
                      { height: `${(day.score / 5) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>{day.day}</Text>
                <Text style={styles.chartValue}>{day.score}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.achievementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color="#6366F1" />
            </TouchableOpacity>
          </View>
          <View style={styles.achievementsList}>
            {achievements.map(renderAchievement)}
          </View>
        </View>
        <View style={styles.streakProtection}>
          <View style={styles.streakHeader}>
            <Shield size={24} color="#10B981" />
            <Text style={styles.streakTitle}>Streak Protection</Text>
          </View>
          <Text style={styles.streakDescription}>
            Keep your streak alive! Use streak protection to avoid losing your
            progress if you miss a day.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#6366F1',
    marginBottom: 16,
  },
  username: {
    color: '#E5E7EB',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  userLevel: {
    color: '#9CA3AF',
    fontSize: 16,
    marginBottom: 16,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  rankText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    color: '#E5E7EB',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activePeriod: {
    backgroundColor: '#6366F1',
  },
  periodText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  activePeriodText: {
    color: '#FFFFFF',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartDay: {
    alignItems: 'center',
  },
  chartBar: {
    width: 24,
    height: 80,
    backgroundColor: '#374151',
    borderRadius: 12,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  chartFill: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    minHeight: 4,
  },
  chartLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  chartValue: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700',
  },
  achievementsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#E5E7EB',
    fontSize: 20,
    fontWeight: '700',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  lockedAchievement: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementName: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lockedText: {
    color: '#9CA3AF',
  },
  achievementDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  achievementDate: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  progressText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  streakProtection: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakTitle: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  streakDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  streakButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  streakButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
