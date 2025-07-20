import { supabase, League, LeagueMembership, LeagueLeaderboard } from '../supabase';

export class LeaguesAPI {
  static async getUserLeagues(): Promise<League[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('leagues')
      .select(`
        *,
        memberships:league_memberships!inner(*)
      `)
      .eq('memberships.user_id', user.id)
      .eq('memberships.is_active', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createLeague(leagueData: {
    name: string;
    description?: string;
    icon?: string;
    isPrivate?: boolean;
    maxMembers?: number;
  }): Promise<League> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('leagues')
      .insert({
        name: leagueData.name,
        description: leagueData.description,
        creator_id: user.id,
        icon: leagueData.icon || '🏆',
        is_private: leagueData.isPrivate || false,
        max_members: leagueData.maxMembers || 50
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async joinLeague(leagueId: string): Promise<LeagueMembership> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if league exists and has space
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('*, memberships:league_memberships(count)')
      .eq('id', leagueId)
      .eq('is_active', true)
      .single();

    if (leagueError) throw leagueError;
    if (!league) throw new Error('League not found');

    const memberCount = league.memberships?.[0]?.count || 0;
    if (memberCount >= league.max_members) {
      throw new Error('League is full');
    }

    // Join league
    const { data, error } = await supabase
      .from('league_memberships')
      .insert({
        league_id: leagueId,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async joinLeagueByCode(inviteCode: string): Promise<LeagueMembership> {
    // Find league by invite code
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id')
      .eq('invite_code', inviteCode)
      .eq('is_active', true)
      .single();

    if (leagueError) throw leagueError;
    if (!league) throw new Error('Invalid invite code');

    return this.joinLeague(league.id);
  }

  static async leaveLeague(leagueId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('league_memberships')
      .update({ is_active: false })
      .eq('league_id', leagueId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  static async getLeagueLeaderboard(leagueId: string): Promise<LeagueLeaderboard[]> {
    const { data, error } = await supabase
      .from('league_leaderboards')
      .select(`
        *,
        user_profile:user_profiles(*)
      `)
      .eq('league_id', leagueId)
      .order('total_points', { ascending: false })
      .order('current_streak', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getLeagueMembers(leagueId: string): Promise<LeagueMembership[]> {
    const { data, error } = await supabase
      .from('league_memberships')
      .select(`
        *,
        user_profile:user_profiles(*)
      `)
      .eq('league_id', leagueId)
      .eq('is_active', true)
      .order('joined_at');

    if (error) throw error;
    return data || [];
  }

  static async searchPublicLeagues(query?: string): Promise<League[]> {
    let queryBuilder = supabase
      .from('leagues')
      .select(`
        *,
        creator:user_profiles!leagues_creator_id_fkey(*),
        member_count:league_memberships(count)
      `)
      .eq('is_private', false)
      .eq('is_active', true);

    if (query) {
      queryBuilder = queryBuilder.ilike('name', `%${query}%`);
    }

    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  }

  static async updateLeague(leagueId: string, updates: Partial<League>): Promise<League> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('leagues')
      .update(updates)
      .eq('id', leagueId)
      .eq('creator_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteLeague(leagueId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('leagues')
      .update({ is_active: false })
      .eq('id', leagueId)
      .eq('creator_id', user.id);

    if (error) throw error;
  }
}