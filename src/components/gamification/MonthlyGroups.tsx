import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Coffee, Video, BookOpen, MapPin } from 'lucide-react';
import { blink } from '@/blink/client';
import { useToast } from '@/hooks/use-toast';

interface MonthlyGroupsProps {
  userProfile: any;
}

interface MonthlyGroup {
  id: string;
  groupName: string;
  groupType: string;
  monthYear: string;
  meetingTime?: string;
  meetingLocation?: string;
  members: any[];
}

export function MonthlyGroups({ userProfile }: MonthlyGroupsProps) {
  const [currentGroup, setCurrentGroup] = useState<MonthlyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getRandomMeetingTime = () => {
    const times = [
      'Thursday 3:00 PM',
      'Friday 2:00 PM', 
      'Wednesday 4:00 PM',
      'Tuesday 3:30 PM',
      'Thursday 2:30 PM'
    ];
    return times[Math.floor(Math.random() * times.length)];
  };

  const getLocationForType = (type: string) => {
    switch (type) {
      case 'cafeteria': {
        const colors = ['Yellow Table', 'Blue Table', 'Green Table', 'Red Table', 'Purple Table'];
        return colors[Math.floor(Math.random() * colors.length)];
      }
      case 'video':
        return 'Virtual Meeting Room';
      case 'skill_sharing':
        return 'Conference Room B';
      default:
        return 'TBD';
    }
  };

  const loadCurrentGroup = useCallback(async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Check if user is in a group for current month
      const groupMembers = await blink.db.groupMembers.list({
        where: { userId: userProfile.id }
      });

      if (groupMembers.length > 0) {
        // Get the group details
        const groups = await blink.db.monthlyGroups.list({
          where: { 
            id: groupMembers[0].groupId,
            monthYear: currentMonth
          }
        });

        if (groups.length > 0) {
          const group = groups[0];
          
          // Get all members of this group
          const allGroupMembers = await blink.db.groupMembers.list({
            where: { groupId: group.id }
          });

          // Get member profiles
          const memberProfiles = [];
          for (const member of allGroupMembers) {
            const profiles = await blink.db.userProfiles.list({
              where: { id: member.userId }
            });
            if (profiles.length > 0) {
              memberProfiles.push(profiles[0]);
            }
          }

          setCurrentGroup({
            ...group,
            members: memberProfiles
          });
        }
      }
    } catch (error) {
      console.error('Error loading current group:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    loadCurrentGroup();
  }, [loadCurrentGroup]);

  const createMonthlyGroups = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Get all active users
      const allUsers = await blink.db.userProfiles.list({
        where: { profileVisibility: "1" }
      });

      // Shuffle users randomly
      const shuffledUsers = [...allUsers].sort(() => Math.random() - 0.5);
      
      // Create groups of 5-6 people
      const groupSize = 5;
      const groupTypes = ['cafeteria', 'video', 'skill_sharing'];
      const groupNames = [
        'Orion 🌌', 'Phoenix 🔥', 'Nova ⭐', 'Cosmos 🌟', 'Stellar ✨',
        'Galaxy 🌠', 'Nebula 🌙', 'Quasar 💫', 'Pulsar ⚡', 'Vortex 🌪️'
      ];

      for (let i = 0; i < shuffledUsers.length; i += groupSize) {
        const groupMembers = shuffledUsers.slice(i, i + groupSize);
        if (groupMembers.length < 3) break; // Skip groups with less than 3 members

        const groupType = groupTypes[Math.floor(Math.random() * groupTypes.length)];
        const groupName = groupNames[Math.floor(Math.random() * groupNames.length)];
        
        // Create group
        const group = await blink.db.monthlyGroups.create({
          groupName,
          groupType,
          monthYear: currentMonth,
          meetingTime: getRandomMeetingTime(),
          meetingLocation: getLocationForType(groupType)
        });

        // Add members to group
        for (const member of groupMembers) {
          await blink.db.groupMembers.create({
            groupId: group.id,
            userId: member.id,
            role: 'member'
          });
        }
      }

      toast({
        title: "Monthly Groups Created! 🎉",
        description: "New networking groups have been formed for this month!",
      });

      loadCurrentGroup();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create monthly groups. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'cafeteria': return <Coffee className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'skill_sharing': return <BookOpen className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  const getGroupColor = (type: string) => {
    switch (type) {
      case 'cafeteria': return 'bg-orange-500';
      case 'video': return 'bg-blue-500';
      case 'skill_sharing': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading monthly groups...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-cyan-600" />
          Monthly Groups
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentGroup ? (
          <div className="space-y-4">
            {/* Current Group Info */}
            <div className="bg-white p-4 rounded-lg border border-cyan-200">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-full ${getGroupColor(currentGroup.groupType)}`}>
                  {getGroupIcon(currentGroup.groupType)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{currentGroup.groupName}</h3>
                  <Badge variant="outline" className="text-xs">
                    {currentGroup.groupType.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Meeting Details */}
              <div className="space-y-2 mb-4">
                {currentGroup.meetingTime && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {currentGroup.meetingTime}
                  </div>
                )}
                {currentGroup.meetingLocation && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {currentGroup.meetingLocation}
                  </div>
                )}
              </div>

              {/* Group Members */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Group Members ({currentGroup.members.length})
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {currentGroup.members.map((member) => (
                    <div key={member.id} className="bg-gray-50 p-2 rounded text-center">
                      <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                      <p className="text-xs text-gray-600 truncate">{member.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Group Type Description */}
            <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200">
              <h4 className="font-medium text-cyan-900 mb-1">
                {currentGroup.groupType === 'cafeteria' && '☕ Cafeteria Circles'}
                {currentGroup.groupType === 'video' && '📹 Video Cluster'}
                {currentGroup.groupType === 'skill_sharing' && '📚 Skill-Sharing Pod'}
              </h4>
              <p className="text-sm text-cyan-800">
                {currentGroup.groupType === 'cafeteria' && 'Meet for casual conversations over coffee or lunch!'}
                {currentGroup.groupType === 'video' && 'Connect virtually for structured networking sessions.'}
                {currentGroup.groupType === 'skill_sharing' && 'Share knowledge and learn new skills together.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-white p-6 rounded-lg border border-cyan-200">
              <Users className="h-12 w-12 text-cyan-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">No Monthly Group Yet</h3>
              <p className="text-sm text-gray-600 mb-4">
                Join a randomly assigned networking group to meet new colleagues!
              </p>
              <Button onClick={createMonthlyGroups} className="w-full">
                Create Monthly Groups
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}