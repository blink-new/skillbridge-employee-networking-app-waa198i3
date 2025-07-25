import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import blink from '@/blink/client'
import { 
  Users, 
  TrendingUp, 
  Award, 
  MessageCircle, 
  Sparkles,
  ArrowRight,
  Target,
  BookOpen
} from 'lucide-react'
import { StreakCounter } from '@/components/gamification/StreakCounter'
import { QRMeetup } from '@/components/gamification/QRMeetup'
import { SkillSwap } from '@/components/gamification/SkillSwap'
import { ConversationStarters } from '@/components/gamification/ConversationStarters'
import { TeamLeaderboard } from '@/components/gamification/TeamLeaderboard'
import { MonthlyGroups } from '@/components/gamification/MonthlyGroups'
import { MatchingSuggestions } from '@/components/ai/MatchingSuggestions'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { LearningSessions } from '@/components/learning/LearningSessions'

interface DashboardProps {
  user: any
  userProfile: any
}

const Dashboard = ({ user, userProfile }: DashboardProps) => {
  const [stats, setStats] = useState({
    connections: 0,
    badges: 0,
    profileCompletion: 0
  })
  const [recentConnections, setRecentConnections] = useState<any[]>([])
  const [suggestedConnections, setSuggestedConnections] = useState<any[]>([])
  const [userBadges, setUserBadges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    if (!user) return

    try {
      // Load user connections
      const connections = await blink.db.connections.list({
        where: {
          OR: [
            { requesterId: user.id, status: 'accepted' },
            { recipientId: user.id, status: 'accepted' }
          ]
        }
      })

      // Load user badges
      const badges = await blink.db.userBadges.list({
        where: { userId: user.id }
      })

      // Load badge details
      const badgeDetails = []
      for (const userBadge of badges) {
        const badge = await blink.db.badges.list({
          where: { id: userBadge.badgeId },
          limit: 1
        })
        if (badge.length > 0) {
          badgeDetails.push(badge[0])
        }
      }

      // Calculate profile completion
      let completionScore = 0
      const fields = [
        userProfile?.name, userProfile?.role, userProfile?.microBio,
        userProfile?.superpower, userProfile?.learningNow, userProfile?.askMeAbout
      ]
      completionScore = (fields.filter(Boolean).length / fields.length) * 100

      setStats({
        connections: connections.length,
        badges: badges.length,
        profileCompletion: Math.round(completionScore)
      })

      setUserBadges(badgeDetails)

      // Load suggested connections (simplified for now)
      const allProfiles = await blink.db.userProfiles.list({
        where: { NOT: { userId: user.id } },
        limit: 3
      })
      setSuggestedConnections(allProfiles)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, userProfile])

  const refreshPoints = async () => {
    // Refresh user profile to get updated points
    if (!user) return
    try {
      const updatedProfile = await blink.db.userProfiles.list({
        where: { id: user.id },
        limit: 1
      })
      if (updatedProfile.length > 0) {
        // Update the userProfile in parent component would be ideal
        // For now, we'll just trigger a reload of dashboard data
        loadDashboardData()
      }
    } catch (error) {
      console.error('Error refreshing points:', error)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {userProfile?.name || 'there'}! 👋
        </h1>
        <p className="text-lg text-gray-600">
          Here's what's happening in your professional network
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.connections}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.badges}</div>
            <p className="text-xs text-muted-foreground">
              Keep building your reputation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Strength</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.profileCompletion}%</div>
            <Progress value={stats.profileCompletion} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfile?.totalPoints || 0}</div>
            <p className="text-xs text-muted-foreground">
              Earn more through activities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gamification Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🎮 Gamification Hub</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <StreakCounter 
            streak={userProfile?.connectionStreak || 0}
            lastConnectionDate={userProfile?.lastConnectionDate}
          />
          <QRMeetup 
            userProfile={userProfile}
            onPointsEarned={refreshPoints}
          />
          <SkillSwap 
            userProfile={userProfile}
            onPointsEarned={refreshPoints}
          />
          <ConversationStarters 
            userProfile={userProfile}
            onPointsEarned={refreshPoints}
          />
          <div className="lg:col-span-2 xl:col-span-1">
            <MonthlyGroups userProfile={userProfile} />
          </div>
        </div>
      </div>

      {/* Team Leaderboard */}
      <div className="mb-8">
        <TeamLeaderboard userProfile={userProfile} />
      </div>

      {/* AI-Powered Features */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🤖 AI-Powered Networking</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <MatchingSuggestions />
          <NotificationCenter />
        </div>
        <LearningSessions />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Your Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-amber-500" />
              Your Badges
            </CardTitle>
            <CardDescription>
              Achievements that showcase your expertise
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userBadges.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {userBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200"
                  >
                    <span className="text-2xl mr-3">{badge.iconEmoji}</span>
                    <div>
                      <p className="font-medium text-sm">{badge.badgeName}</p>
                      <p className="text-xs text-gray-600">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No badges yet. Start connecting to earn your first badge!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suggested Connections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-indigo-500" />
              Suggested Connections
            </CardTitle>
            <CardDescription>
              People you might want to connect with
            </CardDescription>
          </CardHeader>
          <CardContent>
            {suggestedConnections.length > 0 ? (
              <div className="space-y-4">
                {suggestedConnections.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {profile.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{profile.name}</p>
                        <p className="text-sm text-gray-600">{profile.role}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Connect
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" className="w-full">
                  View All Suggestions
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No suggestions available yet. Complete your profile to get better matches!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-green-500" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Things you can do right now
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <MessageCircle className="h-4 w-4 mr-2" />
                Update your learning goals
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Browse colleagues by skill
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Award className="h-4 w-4 mr-2" />
                Join a community group
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              What's been happening in your network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm">You joined SkillBridge!</p>
                  <p className="text-xs text-gray-500">Welcome to the community</p>
                </div>
              </div>
              {stats.badges > 0 && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm">Earned your first badge</p>
                    <p className="text-xs text-gray-500">Keep up the great work!</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard