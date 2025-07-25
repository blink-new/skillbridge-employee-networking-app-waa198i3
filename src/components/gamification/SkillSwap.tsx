import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftRight, Star, BookOpen } from 'lucide-react';
import { blink } from '@/blink/client';
import { useToast } from '@/hooks/use-toast';

interface SkillSwapProps {
  userProfile: any;
  onPointsEarned: () => void;
}

export function SkillSwap({ userProfile, onPointsEarned }: SkillSwapProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    partnerId: '',
    skillTaught: '',
    skillLearned: '',
    sessionNotes: '',
    rating: ''
  });
  const [colleagues, setColleagues] = useState<any[]>([]);
  const { toast } = useToast();

  const loadColleagues = async () => {
    try {
      const allProfiles = await blink.db.userProfiles.list({
        where: { profileVisibility: "1" }
      });
      setColleagues(allProfiles.filter(p => p.id !== userProfile.id));
    } catch (error) {
      console.error('Error loading colleagues:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.partnerId || !formData.skillTaught || !formData.skillLearned) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create skill swap record
      await blink.db.skillSwaps.create({
        teacherId: userProfile.id,
        learnerId: formData.partnerId,
        skillTaught: formData.skillTaught,
        skillLearned: formData.skillLearned,
        sessionNotes: formData.sessionNotes,
        rating: formData.rating ? parseInt(formData.rating) : null
      });

      // Award points for skill swap
      await blink.db.points.create({
        userId: userProfile.id,
        actionType: 'swap',
        points: 15,
        description: `Skill swap: taught ${formData.skillTaught}, learned ${formData.skillLearned}`
      });

      // Log activity
      await blink.db.userActivities.create({
        userId: userProfile.id,
        activityType: 'skill_swap',
        activityData: JSON.stringify({
          partnerId: formData.partnerId,
          skillTaught: formData.skillTaught,
          skillLearned: formData.skillLearned
        }),
        pointsEarned: 15
      });

      // Update total points
      await blink.db.userProfiles.update(userProfile.id, {
        totalPoints: (userProfile.totalPoints || 0) + 15
      });

      // Check for skill swap badge (if 3+ swaps)
      const swapCount = await blink.db.skillSwaps.list({
        where: { teacherId: userProfile.id }
      });

      if (swapCount.length >= 3) {
        // Award skill swap badge
        const badges = await blink.db.badges.list({
          where: { badgeName: 'Knowledge Exchanger' }
        });
        
        if (badges.length > 0) {
          const existingUserBadges = userProfile.badges || '';
          if (!existingUserBadges.includes(badges[0].id)) {
            await blink.db.userProfiles.update(userProfile.id, {
              badges: existingUserBadges ? `${existingUserBadges},${badges[0].id}` : badges[0].id
            });
          }
        }
      }

      toast({
        title: "Skill Swap Logged! 🎉",
        description: "You earned 15 XP for sharing knowledge!",
      });

      onPointsEarned();
      setIsOpen(false);
      setFormData({
        partnerId: '',
        skillTaught: '',
        skillLearned: '',
        sessionNotes: '',
        rating: ''
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log skill swap. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-green-600" />
          Skill Swap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Log your knowledge exchanges with colleagues and earn XP!
        </p>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              onClick={loadColleagues}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Log Skill Swap (+15 XP)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log Skill Swap</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="partner">Learning Partner</Label>
                <Select value={formData.partnerId} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, partnerId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select colleague" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleagues.map((colleague) => (
                      <SelectItem key={colleague.id} value={colleague.id}>
                        {colleague.name} - {colleague.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="skillTaught">Skill You Taught</Label>
                <Input
                  id="skillTaught"
                  value={formData.skillTaught}
                  onChange={(e) => setFormData(prev => ({ ...prev, skillTaught: e.target.value }))}
                  placeholder="e.g., React Hooks, Data Analysis"
                />
              </div>

              <div>
                <Label htmlFor="skillLearned">Skill You Learned</Label>
                <Input
                  id="skillLearned"
                  value={formData.skillLearned}
                  onChange={(e) => setFormData(prev => ({ ...prev, skillLearned: e.target.value }))}
                  placeholder="e.g., Figma Design, SQL Queries"
                />
              </div>

              <div>
                <Label htmlFor="sessionNotes">Session Notes (Optional)</Label>
                <Textarea
                  id="sessionNotes"
                  value={formData.sessionNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, sessionNotes: e.target.value }))}
                  placeholder="What did you learn? Any key insights?"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="rating">Session Rating (Optional)</Label>
                <Select value={formData.rating} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, rating: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Rate the session" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ Excellent</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ Good</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ Average</SelectItem>
                    <SelectItem value="2">⭐⭐ Below Average</SelectItem>
                    <SelectItem value="1">⭐ Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Logging...' : 'Log Skill Swap (+15 XP)'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}