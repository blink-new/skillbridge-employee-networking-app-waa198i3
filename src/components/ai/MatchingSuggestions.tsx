import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sparkles, Users, X, Heart } from 'lucide-react';
import { blink } from '@/blink/client';

interface MatchSuggestion {
  id: string;
  suggested_user_id: string;
  match_score: number;
  match_reasons: string[];
  status: string;
  user_name?: string;
  user_role?: string;
  user_skills?: string[];
  user_badges?: string[];
}

export function MatchingSuggestions() {
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSuggestions = useCallback(async () => {
    try {
      const user = await blink.auth.me();
      
      // Get match suggestions for current user
      const matchData = await blink.db.match_suggestions.list({
        where: { 
          user_id: user.id,
          status: 'pending'
        },
        orderBy: { match_score: 'desc' },
        limit: 5
      });

      // Enrich with user profile data
      const enrichedSuggestions = await Promise.all(
        matchData.map(async (match) => {
          try {
            const profiles = await blink.db.user_profiles.list({
              where: { user_id: match.suggested_user_id }
            });
            
            if (profiles.length > 0) {
              const profile = profiles[0];
              const skillIds = profile.skills ? JSON.parse(profile.skills) : [];
              const badgeIds = profile.badges ? JSON.parse(profile.badges) : [];
              
              // Get skill names
              const skills = skillIds.length > 0 ? await blink.db.skill_tags.list({
                where: { id: { in: skillIds } }
              }) : [];
              
              // Get badge names
              const badges = badgeIds.length > 0 ? await blink.db.badges.list({
                where: { id: { in: badgeIds } }
              }) : [];

              return {
                ...match,
                user_name: profile.name,
                user_role: profile.role,
                user_skills: skills.map(s => s.name),
                user_badges: badges.map(b => b.badge_name),
                match_reasons: match.match_reasons ? JSON.parse(match.match_reasons) : []
              };
            }
            return match;
          } catch (error) {
            console.error('Error enriching suggestion:', error);
            return match;
          }
        })
      );

      setSuggestions(enrichedSuggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const generateAISuggestions = async () => {
    try {
      setLoading(true);
      const user = await blink.auth.me();
      
      // Get current user's profile
      const userProfiles = await blink.db.user_profiles.list({
        where: { user_id: user.id }
      });
      
      if (userProfiles.length === 0) return;
      
      const currentProfile = userProfiles[0];
      const currentSkills = currentProfile.skills ? JSON.parse(currentProfile.skills) : [];
      const currentWorkingStyle = currentProfile.working_style ? JSON.parse(currentProfile.working_style) : [];
      
      // Get all other users
      const allProfiles = await blink.db.user_profiles.list({
        where: { user_id: { neq: user.id } }
      });
      
      // Generate suggestions based on AI matching logic
      const newSuggestions = allProfiles.map(profile => {
        const theirSkills = profile.skills ? JSON.parse(profile.skills) : [];
        const theirWorkingStyle = profile.working_style ? JSON.parse(profile.working_style) : [];
        
        let score = 0;
        const reasons = [];
        
        // Complementary skills matching
        const skillOverlap = currentSkills.filter(skill => theirSkills.includes(skill));
        const skillGaps = currentSkills.filter(skill => !theirSkills.includes(skill));
        
        if (skillOverlap.length > 0) {
          score += skillOverlap.length * 20;
          reasons.push(`Shared ${skillOverlap.length} skills in common`);
        }
        
        if (skillGaps.length > 0 && theirSkills.length > 0) {
          score += 15;
          reasons.push('Has complementary skills you could learn');
        }
        
        // Working style compatibility
        const styleOverlap = currentWorkingStyle.filter(style => theirWorkingStyle.includes(style));
        if (styleOverlap.length > 0) {
          score += styleOverlap.length * 10;
          reasons.push('Compatible working styles');
        }
        
        // Learning interest matching
        if (currentProfile.learning_now && profile.teach_15_min) {
          if (currentProfile.learning_now.toLowerCase().includes(profile.teach_15_min.toLowerCase()) ||
              profile.teach_15_min.toLowerCase().includes(currentProfile.learning_now.toLowerCase())) {
            score += 25;
            reasons.push('Perfect learning match opportunity');
          }
        }
        
        // Department diversity bonus
        if (currentProfile.role && profile.role && currentProfile.role !== profile.role) {
          score += 10;
          reasons.push('Cross-department networking opportunity');
        }
        
        return {
          id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: user.id,
          suggested_user_id: profile.user_id,
          match_score: Math.min(score, 100),
          match_reasons: JSON.stringify(reasons),
          status: 'pending'
        };
      }).filter(suggestion => suggestion.match_score > 20)
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, 5);
      
      // Save suggestions to database
      if (newSuggestions.length > 0) {
        await blink.db.match_suggestions.createMany(newSuggestions);
        await loadSuggestions();
      }
      
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (suggestion: MatchSuggestion) => {
    try {
      const user = await blink.auth.me();
      
      // Create connection request
      await blink.db.connections.create({
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requester_id: user.id,
        requested_id: suggestion.suggested_user_id,
        status: 'pending',
        connection_type: 'skill_match'
      });
      
      // Update suggestion status
      await blink.db.match_suggestions.update(suggestion.id, {
        status: 'connected'
      });
      
      // Create notification for the other user
      await blink.db.notifications.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: suggestion.suggested_user_id,
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${user.email} wants to connect with you based on skill compatibility!`,
        data: JSON.stringify({ requester_id: user.id, match_score: suggestion.match_score })
      });
      
      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      
    } catch (error) {
      console.error('Error connecting:', error);
    }
  };

  const handleDismiss = async (suggestion: MatchSuggestion) => {
    try {
      await blink.db.match_suggestions.update(suggestion.id, {
        status: 'dismissed'
      });
      
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            AI-Powered Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Finding your perfect matches...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          AI-Powered Matches
        </CardTitle>
        <div className="flex gap-2">
          <Button onClick={generateAISuggestions} size="sm" variant="outline">
            <Sparkles className="h-4 w-4 mr-1" />
            Generate New Matches
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No matches found yet</p>
            <Button onClick={generateAISuggestions} variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Find My Matches
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar>
                      <AvatarFallback>
                        {suggestion.user_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{suggestion.user_name || 'Unknown User'}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.match_score}% match
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{suggestion.user_role}</p>
                      
                      {suggestion.user_skills && suggestion.user_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {suggestion.user_skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {suggestion.user_skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{suggestion.user_skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {suggestion.match_reasons && suggestion.match_reasons.length > 0 && (
                        <div className="text-xs text-indigo-600 mb-3">
                          <strong>Why you match:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {suggestion.match_reasons.slice(0, 2).map((reason, index) => (
                              <li key={index}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleConnect(suggestion)}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      Connect
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(suggestion)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}