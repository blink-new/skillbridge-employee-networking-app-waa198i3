import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Users } from 'lucide-react';
import { blink } from '@/blink/client';

interface TeamLeaderboardProps {
  userProfile: any;
}

interface TeamStats {
  department: string;
  totalPoints: number;
  memberCount: number;
  avgPoints: number;
  topMembers: any[];
}

export function TeamLeaderboard({ userProfile }: TeamLeaderboardProps) {
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [userRank, setUserRank] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadTeamStats = useCallback(async () => {
    try {
      // Get all user profiles with points
      const allProfiles = await blink.db.userProfiles.list({
        where: { profileVisibility: "1" }
      });

      // Group by department and calculate stats
      const departmentMap = new Map<string, any[]>();
      
      allProfiles.forEach(profile => {
        const dept = profile.role || 'Unknown Department';
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, []);
        }
        departmentMap.get(dept)!.push(profile);
      });

      // Calculate team statistics
      const stats: TeamStats[] = [];
      
      for (const [department, members] of departmentMap.entries()) {
        const totalPoints = members.reduce((sum, member) => sum + (member.totalPoints || 0), 0);
        const avgPoints = Math.round(totalPoints / members.length);
        
        // Sort members by points for top performers
        const sortedMembers = members
          .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
          .slice(0, 3);

        stats.push({
          department,
          totalPoints,
          memberCount: members.length,
          avgPoints,
          topMembers: sortedMembers
        });
      }

      // Sort teams by total points
      stats.sort((a, b) => b.totalPoints - a.totalPoints);
      setTeamStats(stats);

      // Find user's rank within their department
      const userDept = userProfile.role || 'Unknown Department';
      const userDeptMembers = departmentMap.get(userDept) || [];
      const sortedDeptMembers = userDeptMembers.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
      const rank = sortedDeptMembers.findIndex(member => member.id === userProfile.id) + 1;
      setUserRank(rank);

    } catch (error) {
      console.error('Error loading team stats:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    loadTeamStats();
  }, [loadTeamStats]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1: return <Medal className="h-5 w-5 text-gray-400" />;
      case 2: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <div className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{index + 1}</div>;
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0: return <Badge className="bg-yellow-500">🥇 1st</Badge>;
      case 1: return <Badge className="bg-gray-400">🥈 2nd</Badge>;
      case 2: return <Badge className="bg-amber-600">🥉 3rd</Badge>;
      default: return <Badge variant="outline">#{index + 1}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading leaderboard...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Team Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User's Department Rank */}
        <div className="bg-white p-3 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Your Department Rank</p>
              <p className="text-sm text-gray-600">{userProfile.role || 'Unknown Department'}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-600">#{userRank}</div>
              <p className="text-sm text-gray-600">{userProfile.totalPoints || 0} XP</p>
            </div>
          </div>
        </div>

        {/* Top Teams */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Top Departments
          </h4>
          
          {teamStats.slice(0, 5).map((team, index) => (
            <div key={team.department} className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getRankIcon(index)}
                  <div>
                    <p className="font-medium text-gray-900">{team.department}</p>
                    <p className="text-sm text-gray-600">{team.memberCount} members</p>
                  </div>
                </div>
                <div className="text-right">
                  {getRankBadge(index)}
                  <p className="text-sm text-gray-600 mt-1">{team.totalPoints} total XP</p>
                </div>
              </div>
              
              {/* Top performers in this department */}
              <div className="flex gap-2 mt-2">
                {team.topMembers.slice(0, 3).map((member, memberIndex) => (
                  <div key={member.id} className="flex-1 bg-gray-50 p-2 rounded text-center">
                    <p className="text-xs font-medium text-gray-900 truncate">{member.name}</p>
                    <p className="text-xs text-gray-600">{member.totalPoints || 0} XP</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {teamStats.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No team data available yet. Start earning points to see the leaderboard!
          </div>
        )}
      </CardContent>
    </Card>
  );
}