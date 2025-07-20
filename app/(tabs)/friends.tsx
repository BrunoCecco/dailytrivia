import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  UserPlus,
  Search,
  MessageCircle,
  Trophy,
  Flame,
  Star,
  Users,
  X,
} from 'lucide-react-native';
import { UsersAPI } from '@/lib/api/users';
import {
  supabase,
  UserFriend,
  UserProfile,
  Friendship,
  UserActivity,
} from '@/lib/supabase';
import { useFriends } from '@/hooks/useFriends';
import { useSocial } from '@/hooks/useSocial';

export default function FriendsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('friends');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Use hooks for friends and social
  const {
    friends,
    friendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    refreshFriends,
    loading: friendsLoading,
  } = useFriends();
  const {
    activities: feed,
    refreshSocial,
    loading: socialLoading,
  } = useSocial();

  // Combine loading states
  const loading = friendsLoading || socialLoading;
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search users with debouncing
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setSearching(true);
      try {
        const results = await UsersAPI.searchUsers(searchQuery.trim());
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        const filteredResults = await Promise.all(
          results.map(async (user) => {
            if (currentUser && user.id === currentUser.id) return null;
            try {
              // Use hook method if available, fallback to API
              // (getFriendshipStatus is available in useFriends)
              const friendshipStatus = await (typeof useFriends()
                .getFriendshipStatus === 'function'
                ? useFriends().getFriendshipStatus(user.id)
                : null);
              if (
                friendshipStatus &&
                ['accepted', 'pending'].includes(friendshipStatus.status)
              ) {
                return null;
              }
            } catch (err) {
              // If error checking friendship status, still show the user
              console.log('Error checking friendship status:', err);
            }
            return user;
          })
        );
        const validResults = filteredResults.filter((user) => user !== null);
        setSearchResults(validResults);
        setShowSearchResults(true);
      } catch (err: any) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };
    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Refresh both friends and feed
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([refreshFriends(), refreshSocial()]);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAccept = async (friendshipId: string) => {
    try {
      await acceptFriendRequest(friendshipId);
      refreshFriends();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept request');
    }
  };

  const handleDecline = async (friendshipId: string) => {
    try {
      await declineFriendRequest(friendshipId);
      refreshFriends();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to decline request');
    }
  };

  // Send friend request to a user
  const handleSendFriendRequest = async (userId: string) => {
    try {
      await sendFriendRequest(userId);
      Alert.alert('Request Sent', 'Friend request sent!');
      setSearchQuery('');
      setShowSearchResults(false);
      refreshFriends();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send friend request');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const renderSearchResult = ({ item }: { item: UserProfile }) => (
    <View style={styles.searchResultItem}>
      <View style={styles.searchResultAvatar}>
        <Text style={styles.avatarText}>{item.avatar_url || '👤'}</Text>
      </View>
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>
          {item.display_name || item.username}
        </Text>
        <Text style={styles.searchResultUsername}>@{item.username}</Text>
        <View style={styles.searchResultStats}>
          <View style={styles.statBadge}>
            <Flame size={12} color="#EF4444" />
            <Text style={styles.statBadgeText}>{item.current_streak || 0}</Text>
          </View>
          <View style={styles.statBadge}>
            <Star size={12} color="#F59E0B" />
            <Text style={styles.statBadgeText}>{item.total_points || 0}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleSendFriendRequest(item.id)}
      >
        <UserPlus size={20} color="#6366F1" />
      </TouchableOpacity>
    </View>
  );

  const renderFriend = ({ item }: { item: UserFriend }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendAvatar}>
        <Text style={styles.avatarText}>{item.friend_avatar_url || '👤'}</Text>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: item.status === 'online' ? '#10B981' : '#6B7280',
            },
          ]}
        />
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>
          {item.friend_display_name || item.friend_username || item.friend_id}
        </Text>
        {/* <Text style={styles.friendLastActive}>{item.friend_ || ''}</Text> */}
        <View style={styles.friendStats}>
          <View style={styles.statBadge}>
            <Flame size={12} color="#EF4444" />
            <Text style={styles.statBadgeText}>{item.friend_streak || 0}</Text>
          </View>
          <View style={styles.statBadge}>
            <Star size={12} color="#F59E0B" />
            <Text style={styles.statBadgeText}>{item.friend_points || 0}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.messageButton}>
        <MessageCircle size={20} color="#6366F1" />
      </TouchableOpacity>
    </View>
  );

  interface FriendRequestWithRequester extends Friendship {
    requester?: UserProfile;
    mutualFriends?: number;
  }
  const renderFriendRequest = ({
    item,
  }: {
    item: FriendRequestWithRequester;
  }) => (
    <View style={styles.requestItem}>
      <Text style={styles.requestAvatar}>
        {item.requester?.avatar_url || '👤'}
      </Text>
      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>
          {item.requester?.display_name ||
            item.requester?.username ||
            'Unknown'}
        </Text>
        <Text style={styles.mutualFriends}>
          {item.mutualFriends || 0} mutual friends
        </Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAccept(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => handleDecline(item.id)}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTrashTalkItem = ({ item }: { item: UserActivity }) => (
    <View style={styles.trashTalkItem}>
      <Text style={styles.trashTalkAvatar}>
        {item.user_profile?.avatar_url || '👤'}
      </Text>
      <View style={styles.trashTalkContent}>
        <View style={styles.trashTalkHeader}>
          <Text style={styles.trashTalkUser}>
            {item.user_profile?.display_name ||
              item.user_profile?.username ||
              'User'}
          </Text>
          <Text style={styles.trashTalkTime}>
            {item.created_at
              ? new Date(item.created_at).toLocaleTimeString()
              : ''}
          </Text>
        </View>
        <Text style={styles.trashTalkMessage}>{item.content}</Text>
        <View style={styles.trashTalkFooter}>
          <TouchableOpacity style={styles.likeButton}>
            <Text style={styles.likeText}>❤️ {item.likes_count || 0}</Text>
          </TouchableOpacity>
        </View>
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
        <TouchableOpacity onPress={handleRefresh} style={{ marginTop: 16 }}>
          <Text style={{ color: '#6366F1' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Friends</Text>
          <TouchableOpacity
            style={styles.addFriendButton}
            onPress={() => setShowSearchResults(!showSearchResults)}
          >
            <UserPlus size={20} color="#6366F1" />
            <Text style={styles.addFriendText}>Add Friend</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by username or name..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        {showSearchResults && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>
              {searching
                ? 'Searching...'
                : `Search Results (${searchResults.length})`}
            </Text>
            {searching ? (
              <ActivityIndicator
                size="small"
                color="#6366F1"
                style={styles.searchLoading}
              />
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.searchResultsList}
              />
            ) : (
              <Text style={styles.noResultsText}>No users found</Text>
            )}
          </View>
        )}
      </LinearGradient>
      <View style={styles.content}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Users
              size={20}
              color={activeTab === 'friends' ? '#FFF' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'friends' && styles.activeTabText,
              ]}
            >
              Friends
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            onPress={() => setActiveTab('requests')}
          >
            <UserPlus
              size={20}
              color={activeTab === 'requests' ? '#FFF' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'requests' && styles.activeTabText,
              ]}
            >
              Requests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
            onPress={() => setActiveTab('feed')}
          >
            <MessageCircle
              size={20}
              color={activeTab === 'feed' ? '#FFF' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'feed' && styles.activeTabText,
              ]}
            >
              Feed
            </Text>
          </TouchableOpacity>
        </View>
        {activeTab === 'friends' && (
          <FlatList
            data={friends}
            renderItem={renderFriend}
            keyExtractor={(item) => item.friendship_id}
            scrollEnabled={false}
            contentContainerStyle={styles.friendsList}
          />
        )}
        {activeTab === 'requests' && (
          <View>
            <Text style={styles.sectionTitle}>Friend Requests</Text>
            <FlatList
              data={friendRequests}
              renderItem={renderFriendRequest}
              keyExtractor={(item) => item.id?.toString()}
              scrollEnabled={false}
            />
          </View>
        )}
        {activeTab === 'feed' && (
          <FlatList
            data={feed}
            renderItem={renderTrashTalkItem}
            keyExtractor={(item) => item.id?.toString()}
            scrollEnabled={false}
          />
        )}
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
    marginBottom: 20,
  },
  headerTitle: {
    color: '#E5E7EB',
    fontSize: 28,
    fontWeight: '700',
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  addFriendText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    color: '#E5E7EB',
    fontSize: 16,
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  friendsList: {
    gap: 12,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  friendAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 40,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1F2937',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
  },
  friendLastActive: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  friendStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statBadgeText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  messageButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  requestAvatar: {
    fontSize: 40,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
  },
  mutualFriends: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  declineButtonText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  trashTalkItem: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  trashTalkAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  trashTalkContent: {
    flex: 1,
  },
  trashTalkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trashTalkUser: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },
  trashTalkTime: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  trashTalkMessage: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  trashTalkFooter: {
    flexDirection: 'row',
  },
  likeButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  likeText: {
    color: '#EC4899',
    fontSize: 12,
    fontWeight: '600',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  searchResultAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultUsername: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  searchResultStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  addButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  clearButton: {
    padding: 4,
  },
  searchResultsContainer: {
    backgroundColor: '#1F2937',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  searchResultsTitle: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchLoading: {
    alignSelf: 'center',
    marginVertical: 20,
  },
  searchResultsList: {
    gap: 8,
  },
  noResultsText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 20,
  },
});
