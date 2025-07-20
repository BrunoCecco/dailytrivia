import { useState, useEffect } from 'react';
import { FriendsAPI } from '@/lib/api/friends';
import { UserFriend, Friendship } from '@/lib/supabase';

export function useFriends() {
  const [friends, setFriends] = useState<UserFriend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriendsData();
  }, []);

  const loadFriendsData = async () => {
    try {
      setLoading(true);
      console.log('Loading friends data...');
      const [friendsData, requestsData, sentData] = await Promise.all([
        FriendsAPI.getFriends(),
        FriendsAPI.getFriendRequests(),
        FriendsAPI.getSentFriendRequests(),
      ]);

      setFriends(friendsData);
      setFriendRequests(requestsData);
      setSentRequests(sentData);
    } catch (error) {
      console.error('Error loading friends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      const request = await FriendsAPI.sendFriendRequest(userId);
      setSentRequests((prev) => [request, ...prev]);
      return request;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      await FriendsAPI.acceptFriendRequest(friendshipId);
      // Refresh data to update friends list
      await loadFriendsData();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  };

  const declineFriendRequest = async (friendshipId: string) => {
    try {
      await FriendsAPI.declineFriendRequest(friendshipId);
      setFriendRequests((prev) =>
        prev.filter((req) => req.id !== friendshipId)
      );
    } catch (error) {
      console.error('Error declining friend request:', error);
      throw error;
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      await FriendsAPI.removeFriend(friendshipId);
      setFriends((prev) =>
        prev.filter((friend) => friend.friendship_id !== friendshipId)
      );
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  };

  const getFriendshipStatus = async (userId: string) => {
    try {
      return await FriendsAPI.getFriendshipStatus(userId);
    } catch (error) {
      console.error('Error getting friendship status:', error);
      return null;
    }
  };

  return {
    friends,
    friendRequests,
    sentRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    getFriendshipStatus,
    refreshFriends: loadFriendsData,
  };
}
