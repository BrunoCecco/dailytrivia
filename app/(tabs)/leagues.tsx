import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Trophy,
  Crown,
  Medal,
  Users,
  Plus,
  Flame,
  Star,
} from 'lucide-react-native';
import { LeaguesAPI } from '@/lib/api/leagues';
import { useLeagues } from '@/hooks/useLeagues';

export default function LeaguesScreen() {
  const [selectedLeague, setSelectedLeague] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueDesc, setNewLeagueDesc] = useState('');
  const [createMode, setCreateMode] = useState(false);

  const {
    userLeagues: leagues,
    loading,
    createLeague,
    joinLeague,
    leaveLeague,
    refreshLeagues,
  } = useLeagues();

  // Fetch leaderboard for selected league
  const fetchLeaderboard = async (leagueId: string) => {
    setError(null);
    try {
      const leaderboardData = await LeaguesAPI.getLeagueLeaderboard(leagueId);
      setLeaderboard(
        leaderboardData.map((entry: any, idx: number) => ({
          ...entry,
          isCurrentUser: entry.user_profile?.is_current_user || false,
          avatar: entry.user_profile?.avatar || '👤',
          name:
            entry.user_profile?.display_name ||
            entry.user_profile?.username ||
            'User',
          points: entry.total_points,
          streak: entry.current_streak,
          id: entry.user_id,
        }))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard');
    }
  };

  useEffect(() => {
    if (leagues.length > 0) {
      setSelectedLeague(0);
      fetchLeaderboard(leagues[0].id);
    } else {
      setLeaderboard([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagues]);

  const handleSelectLeague = (index: number) => {
    setSelectedLeague(index);
    if (leagues[index]) {
      fetchLeaderboard(leagues[index].id);
    }
  };

  const handleCreateLeague = async () => {
    if (!newLeagueName) return;
    setCreating(true);
    try {
      await createLeague({
        name: newLeagueName,
        description: newLeagueDesc,
      });
      setNewLeagueName('');
      setNewLeagueDesc('');
      refreshLeagues();
      Alert.alert('Success', 'League created!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create league');
    } finally {
      setCreating(false);
    }
  };

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
        <TouchableOpacity onPress={refreshLeagues} style={{ marginTop: 16 }}>
          <Text style={{ color: '#6366F1' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderLeagueCard = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      style={[
        styles.leagueCard,
        selectedLeague === index && styles.selectedLeagueCard,
      ]}
      onPress={() => handleSelectLeague(index)}
    >
      <View style={styles.leagueHeader}>
        <Text style={styles.leagueIcon}>{item.icon || '🏆'}</Text>
        <View style={styles.leagueInfo}>
          <Text style={styles.leagueName}>{item.name}</Text>
          <Text style={styles.leagueMembers}>
            {item.member_count || 0} members
          </Text>
        </View>
        <View style={styles.leaguePosition}>
          <Text style={styles.positionText}>#{index + 1}</Text>
        </View>
      </View>
      <View style={styles.leagueStats}>
        <View style={styles.statItem}>
          <Trophy size={16} color="#F59E0B" />
          <Text style={styles.statText}>{item.total_points || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Flame size={16} color="#EF4444" />
          <Text style={styles.statText}>{item.current_streak || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderLeaderboardItem = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => (
    <View
      style={[
        styles.leaderboardItem,
        item.isCurrentUser && styles.currentUserItem,
      ]}
    >
      <View style={styles.rankContainer}>
        {index === 0 && <Crown size={20} color="#F59E0B" />}
        {index === 1 && <Medal size={20} color="#E5E7EB" />}
        {index === 2 && <Medal size={20} color="#CD7C2F" />}
        {index > 2 && <Text style={styles.rankText}>{index + 1}</Text>}
      </View>
      <Text style={styles.avatar}>{item.avatar}</Text>
      <View style={styles.playerInfo}>
        <Text
          style={[
            styles.playerName,
            item.isCurrentUser && styles.currentUserName,
          ]}
        >
          {item.name}
        </Text>
        <View style={styles.playerStats}>
          <View style={styles.playerStatItem}>
            <Star size={12} color="#F59E0B" />
            <Text style={styles.playerStatText}>{item.points}</Text>
          </View>
          <View style={styles.playerStatItem}>
            <Flame size={12} color="#EF4444" />
            <Text style={styles.playerStatText}>{item.streak}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Leagues</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setCreateMode(true)}
          >
            <Plus size={20} color="#6366F1" />
            <Text style={styles.createButtonText}>Create League</Text>
          </TouchableOpacity>
        </View>
        {createMode && (
          <View style={styles.createLeagueForm}>
            <TextInput
              style={styles.input}
              placeholder="League Name"
              placeholderTextColor="#9CA3AF"
              value={newLeagueName}
              onChangeText={setNewLeagueName}
            />
            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              placeholderTextColor="#9CA3AF"
              value={newLeagueDesc}
              onChangeText={setNewLeagueDesc}
            />
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateLeague}
            >
              <Text style={styles.createButtonText}>
                {creating ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>My Leagues</Text>
        <FlatList
          data={leagues}
          renderItem={renderLeagueCard}
          keyExtractor={(item) => item.id?.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leaguesList}
        />
        <View style={styles.leaderboardContainer}>
          <View style={styles.leaderboardHeader}>
            <Text style={styles.leaderboardTitle}>
              {leagues[selectedLeague]?.name || 'League'} Leaderboard
            </Text>
            <View style={styles.seasonBadge}>
              <Text style={styles.seasonText}>Season 3</Text>
            </View>
          </View>
          <FlatList
            data={leaderboard}
            renderItem={renderLeaderboardItem}
            keyExtractor={(item) => item.id?.toString()}
            scrollEnabled={false}
          />
        </View>
        <View style={styles.tournamentCard}>
          <View style={styles.tournamentHeader}>
            <Trophy size={24} color="#EC4899" />
            <Text style={styles.tournamentTitle}>Weekly Tournament</Text>
          </View>
          <Text style={styles.tournamentDescription}>
            Compete for exclusive badges and streak boosters!
          </Text>
          <View style={styles.tournamentTimer}>
            <Text style={styles.timerText}>Ends in: 2d 14h 32m</Text>
          </View>
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join Tournament</Text>
          </TouchableOpacity>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#E5E7EB',
    fontSize: 28,
    fontWeight: '700',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  createButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    color: '#E5E7EB',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  leaguesList: {
    paddingRight: 20,
  },
  leagueCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: 200,
    borderWidth: 1,
    borderColor: '#374151',
  },
  selectedLeagueCard: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  leagueIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
  },
  leagueMembers: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  leaguePosition: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  positionText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '700',
  },
  leagueStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  leaderboardContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  leaderboardTitle: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
  },
  seasonBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seasonText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  currentUserItem: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
  },
  rankText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  avatar: {
    fontSize: 32,
    marginHorizontal: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
  },
  currentUserName: {
    color: '#6366F1',
    fontWeight: '700',
  },
  playerStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  playerStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerStatText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginLeft: 4,
  },
  tournamentCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  tournamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tournamentTitle: {
    color: '#E5E7EB',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  tournamentDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  tournamentTimer: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  timerText: {
    color: '#EC4899',
    fontSize: 14,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#EC4899',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  createLeagueForm: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  input: {
    backgroundColor: '#263238',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#E5E7EB',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
});
