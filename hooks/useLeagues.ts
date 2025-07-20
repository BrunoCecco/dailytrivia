import { useState, useEffect } from 'react';
import { LeaguesAPI } from '@/lib/api/leagues';
import { League, LeagueLeaderboard } from '@/lib/supabase';

export function useLeagues() {
  const [userLeagues, setUserLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserLeagues();
  }, []);

  const loadUserLeagues = async () => {
    try {
      setLoading(true);
      const leagues = await LeaguesAPI.getUserLeagues();
      setUserLeagues(leagues);
    } catch (error) {
      console.error('Error loading leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const createLeague = async (leagueData: {
    name: string;
    description?: string;
    icon?: string;
    isPrivate?: boolean;
    maxMembers?: number;
  }) => {
    try {
      const league = await LeaguesAPI.createLeague(leagueData);
      setUserLeagues(prev => [league, ...prev]);
      return league;
    } catch (error) {
      console.error('Error creating league:', error);
      throw error;
    }
  };

  const joinLeague = async (leagueId: string) => {
    try {
      await LeaguesAPI.joinLeague(leagueId);
      await loadUserLeagues(); // Refresh to show new league
    } catch (error) {
      console.error('Error joining league:', error);
      throw error;
    }
  };

  const joinLeagueByCode = async (inviteCode: string) => {
    try {
      await LeaguesAPI.joinLeagueByCode(inviteCode);
      await loadUserLeagues(); // Refresh to show new league
    } catch (error) {
      console.error('Error joining league by code:', error);
      throw error;
    }
  };

  const leaveLeague = async (leagueId: string) => {
    try {
      await LeaguesAPI.leaveLeague(leagueId);
      setUserLeagues(prev => prev.filter(league => league.id !== leagueId));
    } catch (error) {
      console.error('Error leaving league:', error);
      throw error;
    }
  };

  const getLeagueLeaderboard = async (leagueId: string): Promise<LeagueLeaderboard[]> => {
    try {
      return await LeaguesAPI.getLeagueLeaderboard(leagueId);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      return [];
    }
  };

  const searchPublicLeagues = async (query?: string): Promise<League[]> => {
    try {
      return await LeaguesAPI.searchPublicLeagues(query);
    } catch (error) {
      console.error('Error searching leagues:', error);
      return [];
    }
  };

  return {
    userLeagues,
    loading,
    createLeague,
    joinLeague,
    joinLeagueByCode,
    leaveLeague,
    getLeagueLeaderboard,
    searchPublicLeagues,
    refreshLeagues: loadUserLeagues,
  };
}