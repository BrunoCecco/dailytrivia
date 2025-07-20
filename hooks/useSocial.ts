import { useState, useEffect, useRef } from 'react';
import { SocialAPI } from '@/lib/api/social';
import { UserActivity, Notification } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useSocial() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (user) {
      loadSocialData();
      // Clean up previous subscriptions if any
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      unsubscribeRef.current = setupRealtimeSubscriptions();
    }
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user]);

  const loadSocialData = async () => {
    try {
      setLoading(true);
      const [activitiesData, notificationsData, unreadCountData] =
        await Promise.all([
          SocialAPI.getFriendActivities(),
          SocialAPI.getNotifications(),
          SocialAPI.getUnreadNotificationCount(),
        ]);

      setActivities(activitiesData);
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Error loading social data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user) return () => {}; // Return a no-op unsubscribe function

    // Subscribe to new activities
    const activitiesSubscription = SocialAPI.subscribeToActivities(
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setActivities((prev) => [payload.new, ...prev]);
        }
      }
    );

    // Subscribe to notifications
    const notificationsSubscription = SocialAPI.subscribeToNotifications(
      user.id,
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      }
    );

    return () => {
      activitiesSubscription.unsubscribe();
      notificationsSubscription.unsubscribe();
    };
  };

  const createActivity = async (activityData: {
    activityType: UserActivity['activity_type'];
    content: string;
    metadata?: any;
    isPublic?: boolean;
  }) => {
    try {
      const activity = await SocialAPI.createActivity(activityData);
      setActivities((prev) => [activity, ...prev]);
      return activity;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  };

  const likeActivity = async (activityId: string) => {
    try {
      await SocialAPI.likeActivity(activityId);
      // Update local state optimistically
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                user_liked: true,
                likes_count: (activity.likes_count || 0) + 1,
              }
            : activity
        )
      );
    } catch (error) {
      console.error('Error liking activity:', error);
      throw error;
    }
  };

  const unlikeActivity = async (activityId: string) => {
    try {
      await SocialAPI.unlikeActivity(activityId);
      // Update local state optimistically
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                user_liked: false,
                likes_count: Math.max((activity.likes_count || 0) - 1, 0),
              }
            : activity
        )
      );
    } catch (error) {
      console.error('Error unliking activity:', error);
      throw error;
    }
  };

  const commentOnActivity = async (activityId: string, content: string) => {
    try {
      const comment = await SocialAPI.commentOnActivity(activityId, content);
      // Update local state optimistically
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                comments_count: (activity.comments_count || 0) + 1,
              }
            : activity
        )
      );
      return comment;
    } catch (error) {
      console.error('Error commenting on activity:', error);
      throw error;
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await SocialAPI.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await SocialAPI.markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  return {
    activities,
    notifications,
    unreadCount,
    loading,
    createActivity,
    likeActivity,
    unlikeActivity,
    commentOnActivity,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshSocial: loadSocialData,
  };
}
