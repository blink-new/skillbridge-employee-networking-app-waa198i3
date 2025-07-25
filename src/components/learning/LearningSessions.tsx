import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Clock, Video, Users, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { blink } from '@/blink/client';

interface LearningSession {
  id: string;
  teacher_id: string;
  learner_id: string;
  skill_topic: string;
  session_type: string;
  scheduled_time?: string;
  duration_minutes: number;
  status: string;
  notes?: string;
  created_at: string;
  teacher_name?: string;
  learner_name?: string;
}

export function LearningSessions() {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
  
  // Form state
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [skillTopic, setSkillTopic] = useState('');
  const [sessionType, setSessionType] = useState('virtual');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState(15);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const user = await blink.auth.me();
      
      // Get sessions where user is either teacher or learner
      const sessionData = await blink.db.learning_sessions.list({
        where: {
          OR: [
            { teacher_id: user.id },
            { learner_id: user.id }
          ]
        },
        orderBy: { created_at: 'desc' }
      });

      // Enrich with user names
      const enrichedSessions = await Promise.all(
        sessionData.map(async (session) => {
          try {
            const teacherProfiles = await blink.db.user_profiles.list({
              where: { user_id: session.teacher_id }
            });
            
            const learnerProfiles = await blink.db.user_profiles.list({
              where: { user_id: session.learner_id }
            });

            return {
              ...session,
              teacher_name: teacherProfiles[0]?.name || 'Unknown User',
              learner_name: learnerProfiles[0]?.name || 'Unknown User'
            };
          } catch (error) {
            console.error('Error enriching session:', error);
            return session;
          }
        })
      );

      setSessions(enrichedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAvailableTeachers = useCallback(async () => {
    try {
      const user = await blink.auth.me();
      
      // Get users who have teach_15_min field filled
      const profiles = await blink.db.user_profiles.list({
        where: { 
          user_id: { neq: user.id },
          teach_15_min: { neq: null }
        }
      });

      setAvailableTeachers(profiles.filter(p => p.teach_15_min && p.teach_15_min.trim()));
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    loadAvailableTeachers();
  }, [loadSessions, loadAvailableTeachers]);

  const requestSession = async () => {
    if (!selectedTeacher || !skillTopic.trim()) return;
    
    try {
      setSubmitting(true);
      const user = await blink.auth.me();
      
      // Create learning session request
      await blink.db.learning_sessions.create({
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        teacher_id: selectedTeacher,
        learner_id: user.id,
        skill_topic: skillTopic.trim(),
        session_type: sessionType,
        scheduled_time: scheduledTime || null,
        duration_minutes: duration,
        status: 'requested',
        notes: notes.trim() || null
      });

      // Create notification for the teacher
      const teacher = availableTeachers.find(t => t.user_id === selectedTeacher);
      await blink.db.notifications.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: selectedTeacher,
        type: 'learning_request',
        title: 'New Learning Session Request',
        message: `${user.email} wants to learn ${skillTopic} from you!`,
        data: JSON.stringify({ 
          learner_id: user.id, 
          skill_topic: skillTopic,
          session_type: sessionType,
          duration_minutes: duration
        })
      });

      // Reset form and reload
      setSelectedTeacher('');
      setSkillTopic('');
      setSessionType('virtual');
      setScheduledTime('');
      setDuration(15);
      setNotes('');
      setShowRequestForm(false);
      await loadSessions();
      
    } catch (error) {
      console.error('Error requesting session:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const updateSessionStatus = async (sessionId: string, newStatus: string) => {
    try {
      await blink.db.learning_sessions.update(sessionId, {
        status: newStatus
      });

      // Award points for completed sessions
      if (newStatus === 'completed') {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          // Points for teacher
          await blink.db.user_points.create({
            id: `points_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: session.teacher_id,
            action_type: 'teach_session',
            points: 20,
            description: `Taught ${session.skill_topic}`
          });

          // Points for learner
          await blink.db.user_points.create({
            id: `points_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: session.learner_id,
            action_type: 'complete_learning',
            points: 15,
            description: `Learned ${session.skill_topic}`
          });
        }
      }

      await loadSessions();
    } catch (error) {
      console.error('Error updating session status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'confirmed':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-amber-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            Learning Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading sessions...</p>
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
            <BookOpen className="h-5 w-5 text-indigo-600" />
            Learning Sessions
            <Badge variant="secondary" className="text-xs">
              {sessions.length}
            </Badge>
          </CardTitle>
          <Button 
            onClick={() => setShowRequestForm(!showRequestForm)} 
            size="sm"
            variant="outline"
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Request Session
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Request Form */}
        {showRequestForm && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium mb-3">Request a Learning Session</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Teacher</label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a teacher..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeachers.map((teacher) => (
                      <SelectItem key={teacher.user_id} value={teacher.user_id}>
                        <div className="flex items-center gap-2">
                          <span>{teacher.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {teacher.teach_15_min}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Skill Topic</label>
                <Input
                  value={skillTopic}
                  onChange={(e) => setSkillTopic(e.target.value)}
                  placeholder="What do you want to learn?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Session Type</label>
                <Select value={sessionType} onValueChange={setSessionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                    <SelectItem value="async">Async</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Preferred Time (optional)</label>
                <Input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Additional Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific topics or questions you'd like to cover..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={requestSession}
                disabled={!selectedTeacher || !skillTopic.trim() || submitting}
                size="sm"
              >
                {submitting ? 'Requesting...' : 'Send Request'}
              </Button>
              <Button 
                onClick={() => setShowRequestForm(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No learning sessions yet</p>
            <p className="text-sm text-gray-400">
              Request a session to start learning from your colleagues!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {session.teacher_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{session.skill_topic}</h4>
                        <Badge className={`text-xs ${getStatusColor(session.status)}`}>
                          {getStatusIcon(session.status)}
                          <span className="ml-1">{session.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <p><strong>Teacher:</strong> {session.teacher_name}</p>
                        <p><strong>Learner:</strong> {session.learner_name}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          {sessionType === 'virtual' ? <Video className="h-3 w-3" /> : 
                           sessionType === 'in_person' ? <Users className="h-3 w-3" /> : 
                           <BookOpen className="h-3 w-3" />}
                          <span>{session.session_type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{session.duration_minutes} min</span>
                        </div>
                        {session.scheduled_time && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(session.scheduled_time).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {session.notes && (
                        <p className="text-sm text-gray-700 bg-gray-100 p-2 rounded mt-2">
                          {session.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {session.status === 'requested' && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => updateSessionStatus(session.id, 'confirmed')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateSessionStatus(session.id, 'cancelled')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}
                  
                  {session.status === 'confirmed' && (
                    <Button
                      size="sm"
                      onClick={() => updateSessionStatus(session.id, 'completed')}
                      className="ml-4"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}