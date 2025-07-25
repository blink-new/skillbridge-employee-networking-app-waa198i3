import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, MessageSquare, Star, Plus } from 'lucide-react';
import { blink } from '@/blink/client';

interface SkillEndorsement {
  id: string;
  endorser_id: string;
  endorsed_user_id: string;
  skill_id: string;
  message: string;
  created_at: string;
  endorser_name?: string;
  skill_name?: string;
}

interface SkillEndorsementsProps {
  userId: string;
  isOwnProfile?: boolean;
}

export function SkillEndorsements({ userId, isOwnProfile = false }: SkillEndorsementsProps) {
  const [endorsements, setEndorsements] = useState<SkillEndorsement[]>([]);
  const [userSkills, setUserSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEndorseForm, setShowEndorseForm] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [endorsementMessage, setEndorsementMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadEndorsements = useCallback(async () => {
    try {
      // Get endorsements for this user
      const endorsementData = await blink.db.skill_endorsements.list({
        where: { endorsed_user_id: userId },
        orderBy: { created_at: 'desc' }
      });

      // Enrich with endorser and skill data
      const enrichedEndorsements = await Promise.all(
        endorsementData.map(async (endorsement) => {
          try {
            // Get endorser profile
            const endorserProfiles = await blink.db.user_profiles.list({
              where: { user_id: endorsement.endorser_id }
            });
            
            // Get skill name
            const skills = await blink.db.skill_tags.list({
              where: { id: endorsement.skill_id }
            });

            return {
              ...endorsement,
              endorser_name: endorserProfiles[0]?.name || 'Unknown User',
              skill_name: skills[0]?.name || 'Unknown Skill'
            };
          } catch (error) {
            console.error('Error enriching endorsement:', error);
            return endorsement;
          }
        })
      );

      setEndorsements(enrichedEndorsements);

      // Get user's skills for endorsement form
      if (!isOwnProfile) {
        const userProfiles = await blink.db.user_profiles.list({
          where: { user_id: userId }
        });
        
        if (userProfiles.length > 0) {
          const profile = userProfiles[0];
          const skillIds = profile.skills ? JSON.parse(profile.skills) : [];
          
          if (skillIds.length > 0) {
            const skills = await blink.db.skill_tags.list({
              where: { id: { in: skillIds } }
            });
            setUserSkills(skills);
          }
        }
      }
    } catch (error) {
      console.error('Error loading endorsements:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, isOwnProfile]);

  useEffect(() => {
    loadEndorsements();
  }, [loadEndorsements]);

  const submitEndorsement = async () => {
    if (!selectedSkill || !endorsementMessage.trim()) return;
    
    try {
      setSubmitting(true);
      const user = await blink.auth.me();
      
      // Create endorsement
      await blink.db.skill_endorsements.create({
        id: `endorse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        endorser_id: user.id,
        endorsed_user_id: userId,
        skill_id: selectedSkill,
        message: endorsementMessage.trim()
      });

      // Create notification for the endorsed user
      const skill = userSkills.find(s => s.id === selectedSkill);
      await blink.db.notifications.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        type: 'skill_endorsement',
        title: 'New Skill Endorsement',
        message: `${user.email} endorsed your ${skill?.name} skills!`,
        data: JSON.stringify({ 
          endorser_id: user.id, 
          skill_id: selectedSkill,
          skill_name: skill?.name 
        })
      });

      // Award points to both users
      await blink.db.user_points.create({
        id: `points_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        action_type: 'endorse_skill',
        points: 5,
        description: `Endorsed ${skill?.name} skill`
      });

      await blink.db.user_points.create({
        id: `points_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        action_type: 'receive_endorsement',
        points: 10,
        description: `Received endorsement for ${skill?.name}`
      });

      // Reset form and reload
      setEndorsementMessage('');
      setSelectedSkill('');
      setShowEndorseForm(false);
      await loadEndorsements();
      
    } catch (error) {
      console.error('Error submitting endorsement:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const groupedEndorsements = endorsements.reduce((acc, endorsement) => {
    const skillName = endorsement.skill_name || 'Unknown Skill';
    if (!acc[skillName]) {
      acc[skillName] = [];
    }
    acc[skillName].push(endorsement);
    return acc;
  }, {} as Record<string, SkillEndorsement[]>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-600" />
            Skill Endorsements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading endorsements...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-600" />
            Skill Endorsements
            <Badge variant="secondary" className="text-xs">
              {endorsements.length}
            </Badge>
          </CardTitle>
          {!isOwnProfile && userSkills.length > 0 && (
            <Button 
              onClick={() => setShowEndorseForm(!showEndorseForm)} 
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-1" />
              Endorse Skills
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Endorsement Form */}
        {showEndorseForm && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium mb-3">Endorse a Skill</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Select Skill</label>
                <div className="flex flex-wrap gap-2">
                  {userSkills.map((skill) => (
                    <Button
                      key={skill.id}
                      size="sm"
                      variant={selectedSkill === skill.id ? "default" : "outline"}
                      onClick={() => setSelectedSkill(skill.id)}
                    >
                      {skill.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              {selectedSkill && (
                <div>
                  <label className="block text-sm font-medium mb-2">Your Endorsement</label>
                  <Textarea
                    value={endorsementMessage}
                    onChange={(e) => setEndorsementMessage(e.target.value)}
                    placeholder="Share why you're endorsing this skill..."
                    className="min-h-[80px]"
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={submitEndorsement}
                  disabled={!selectedSkill || !endorsementMessage.trim() || submitting}
                  size="sm"
                >
                  {submitting ? 'Submitting...' : 'Submit Endorsement'}
                </Button>
                <Button 
                  onClick={() => setShowEndorseForm(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Endorsements Display */}
        {Object.keys(groupedEndorsements).length === 0 ? (
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No skill endorsements yet</p>
            {!isOwnProfile && (
              <p className="text-sm text-gray-400">
                Be the first to endorse their skills!
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEndorsements).map(([skillName, skillEndorsements]) => (
              <div key={skillName} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="font-medium">
                    {skillName}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {skillEndorsements.length} endorsement{skillEndorsements.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {skillEndorsements.map((endorsement) => (
                    <div key={endorsement.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {endorsement.endorser_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{endorsement.endorser_name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(endorsement.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700">{endorsement.message}</p>
                      </div>
                      
                      <ThumbsUp className="h-4 w-4 text-amber-600 mt-1" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}