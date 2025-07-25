import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Shuffle, Target, Users, Lightbulb } from 'lucide-react';
import { blink } from '@/blink/client';
import { useToast } from '@/hooks/use-toast';

interface ConversationStartersProps {
  userProfile: any;
  onPointsEarned: () => void;
}

export function ConversationStarters({ userProfile, onPointsEarned }: ConversationStartersProps) {
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<string>('');
  const { toast } = useToast();

  const modules = [
    {
      id: 'question_roulette',
      title: 'Question Roulette',
      description: 'Random conversation starter',
      icon: MessageCircle,
      color: 'bg-blue-500',
      category: 'icebreaker'
    },
    {
      id: 'debate_mode',
      title: 'Debate Mode',
      description: 'Take a stance on hot topics',
      icon: Target,
      color: 'bg-red-500',
      category: 'debate'
    },
    {
      id: 'pair_challenge',
      title: 'Pair Challenge',
      description: 'Find someone who...',
      icon: Users,
      color: 'bg-green-500',
      category: 'challenge'
    },
    {
      id: 'truth_lie',
      title: 'Truth/Lie Game',
      description: 'Share 3 facts, 1 is false',
      icon: Lightbulb,
      color: 'bg-purple-500',
      category: 'truth_lie'
    }
  ];

  const getRandomQuestion = async (category: string) => {
    try {
      const questions = await blink.db.questions.list({
        where: { 
          category: category,
          isActive: "1"
        }
      });
      
      if (questions.length === 0) {
        throw new Error('No questions found for this category');
      }
      
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      setCurrentQuestion(randomQuestion);
      setIsModalOpen(true);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load question. Please try again.",
        variant: "destructive"
      });
    }
  };

  const completeActivity = async () => {
    try {
      // Award points for completing conversation starter
      await blink.db.points.create({
        userId: userProfile.id,
        actionType: 'icebreaker',
        points: 5,
        description: `Completed ${activeModule.replace('_', ' ')}`
      });

      // Log activity
      await blink.db.userActivities.create({
        userId: userProfile.id,
        activityType: 'icebreaker',
        activityData: JSON.stringify({
          module: activeModule,
          questionId: currentQuestion?.id
        }),
        pointsEarned: 5
      });

      // Update total points
      await blink.db.userProfiles.update(userProfile.id, {
        totalPoints: (userProfile.totalPoints || 0) + 5
      });

      toast({
        title: "Activity Completed! 🎉",
        description: "You earned 5 XP for engaging in conversation!",
      });

      onPointsEarned();
      setIsModalOpen(false);
      setCurrentQuestion(null);
      setActiveModule('');

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete activity. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleModuleClick = (module: any) => {
    setActiveModule(module.id);
    getRandomQuestion(module.category);
  };

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-indigo-600" />
          Conversation Starters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Break the ice and earn XP with fun conversation modules!
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          {modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <Button
                key={module.id}
                variant="outline"
                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-gray-50"
                onClick={() => handleModuleClick(module)}
              >
                <div className={`p-2 rounded-full ${module.color}`}>
                  <IconComponent className="h-4 w-4 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-xs">{module.title}</div>
                  <div className="text-xs text-gray-500">{module.description}</div>
                </div>
              </Button>
            );
          })}
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                {modules.find(m => m.id === activeModule)?.title}
              </DialogTitle>
            </DialogHeader>
            
            {currentQuestion && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-lg font-medium text-gray-900">
                    {currentQuestion.questionText}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {currentQuestion.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {currentQuestion.difficulty}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={completeActivity}
                    className="w-full"
                  >
                    Mark as Completed (+5 XP)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => getRandomQuestion(currentQuestion.category)}
                    className="w-full"
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Get Another Question
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}