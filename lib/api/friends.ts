import { supabase, Friendship, UserFriend, UserProfile } from '../supabase';

export class FriendsAPI {
  static async getFriends(): Promise<UserFriend[]> {
    const { data, error } = await supabase
      .from('user_friends')
      .select('*')
      .eq('status', 'accepted')
      .order('friend_display_name');

    console.log('Friends data:', data, 'Error:', error);

    if (error) throw error;
    return data || [];
  }

  static async getFriendRequests(): Promise<
    (Friendship & {
      requester?: UserProfile;
      addressee?: UserProfile;
      mutualFriends?: number;
    })[]
  > {
    // const {
    //   data: { user },
    // } = await supabase.auth.getUser();
    // if (!user) throw new Error('Not authenticated');

    // // Get all accepted friends of the current user
    // const { data: myFriends, error: myFriendsError } = await supabase
    //   .from('user_friends')
    //   .select('friend_id')
    //   .eq('status', 'accepted');
    // if (myFriendsError) throw myFriendsError;
    // const myFriendIds = myFriends?.map((f) => f.friend_id) || [];

    // const { data, error } = await supabase
    //   .from('friendships')
    //   .select(
    //     `
    //     *,
    //     requester:user_profiles!friendships_requester_id_fkey(*),
    //     addressee:user_profiles!friendships_addressee_id_fkey(*)
    //   `
    //   )
    //   .eq('addressee_id', user.id)
    //   .eq('status', 'pending')
    //   .order('created_at', { ascending: false });

    // if (error) throw error;
    // // For each request, count mutual friends
    // const withMutuals = (data || []).map((req: any) => {
    //   const requesterFriends: string[] = req.requester?.friends || [];
    //   // If you want to fetch requester's friends, you need to fetch them here
    //   // For now, just count overlap with myFriendIds if available
    //   // This is a placeholder; for real mutuals, you'd need another query
    //   return {
    //     ...req,
    //     mutualFriends: undefined, // You can implement this with another query if needed
    //   };
    // });
    // return withMutuals;
    return [];
  }

  static async getSentFriendRequests(): Promise<
    (Friendship & { addressee?: UserProfile })[]
  > {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    console.log('Fetching sent friend requests for user:', user.id);

    const { data, error } = await supabase
      .from('friendships')
      .select(
        `
        *,
        addressee:user_profiles!friendships_addressee_id_fkey(*)
      `
      )
      .eq('requester_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async sendFriendRequest(addresseeId: string): Promise<Friendship> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`
      )
      .single();

    if (existing) {
      throw new Error('Friendship request already exists');
    }

    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: user.id,
        addressee_id: addresseeId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async acceptFriendRequest(friendshipId: string): Promise<Friendship> {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async declineFriendRequest(friendshipId: string): Promise<Friendship> {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'declined' })
      .eq('id', friendshipId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async removeFriend(friendshipId: string): Promise<void> {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) throw error;
  }

  static async blockUser(friendshipId: string): Promise<Friendship> {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'blocked' })
      .eq('id', friendshipId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getFriendshipStatus(userId: string): Promise<Friendship | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`
      )
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}
