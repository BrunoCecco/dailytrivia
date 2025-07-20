import {
  supabase,
  UserActivity,
  ActivityLike,
  ActivityComment,
  Notification,
} from '../supabase';

export class SocialAPI {
  static async getFriendActivities(
    limit: number = 20
  ): Promise<UserActivity[]> {
    // First get the current user's friend IDs
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: friendsData, error: friendsError } = await supabase
      .from('user_friends')
      .select('friend_id')
      .eq('status', 'accepted');

    if (friendsError) throw friendsError;

    // Extract friend IDs
    const friendIds = friendsData?.map((friend) => friend.friend_id) || [];

    // If no friends, return empty array
    if (friendIds.length === 0) {
      return [];
    }

    // Get activities from friends
    const { data, error } = await supabase
      .from('user_activities')
      .select(
        `
        *,
        user_profile:user_profiles(*),
        likes:activity_likes(count),
        comments:activity_comments(count)
      `
      )
      .eq('is_public', true)
      .in('user_id', friendIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async createActivity(activityData: {
    activityType: UserActivity['activity_type'];
    content: string;
    metadata?: any;
    isPublic?: boolean;
  }): Promise<UserActivity> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        activity_type: activityData.activityType,
        content: activityData.content,
        metadata: activityData.metadata || {},
        is_public: activityData.isPublic !== false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async likeActivity(activityId: string): Promise<ActivityLike> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('activity_likes')
      .insert({
        activity_id: activityId,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async unlikeActivity(activityId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('activity_likes')
      .delete()
      .eq('activity_id', activityId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  static async commentOnActivity(
    activityId: string,
    content: string
  ): Promise<ActivityComment> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('activity_comments')
      .insert({
        activity_id: activityId,
        user_id: user.id,
        content,
      })
      .select(
        `
        *,
        user_profile:user_profiles(*)
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  static async getActivityComments(
    activityId: string
  ): Promise<ActivityComment[]> {
    const { data, error } = await supabase
      .from('activity_comments')
      .select(
        `
        *,
        user_profile:user_profiles(*)
      `
      )
      .eq('activity_id', activityId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  static async deleteComment(commentId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('activity_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  static async getNotifications(limit: number = 50): Promise<Notification[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  static async markAllNotificationsAsRead(): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
  }

  static async getUnreadNotificationCount(): Promise<number> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  static subscribeToActivities(callback: (payload: any) => void) {
    return supabase
      .channel('user_activities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_activities',
        },
        callback
      )
      .subscribe();
  }

  static subscribeToNotifications(
    userId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  }
}
