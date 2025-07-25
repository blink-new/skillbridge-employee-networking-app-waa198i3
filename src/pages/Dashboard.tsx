import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Progress } from '../components/ui/progress'
import { GlassCard } from '../components/ui/glass-card'
import { AnimatedPage } from '../components/ui/animated-page'
import { blink } from '../blink/client'
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
import { StreakCounter } from '../components/gamification/StreakCounter'
import { QRMeetup } from '../components/gamification/QRMeetup'
import { SkillSwap } from '../components/gamification/SkillSwap'
import { ConversationStarters } from '../components/gamification/ConversationStarters'
import { TeamLeaderboard } from '../components/gamification/TeamLeaderboard'
import { MonthlyGroups } from '../components/gamification/MonthlyGroups'
import { MatchingSuggestions } from '../components/ai/MatchingSuggestions'
import { NotificationCenter } from '../components/notifications/NotificationCenter'
import { LearningSessions } from '../components/learning/LearningSessions'

export function Dashboard() {
  const [stats, setStats] = useState({
    connections: 0,
    badges: 0,
    profileCompletion: 0
  })
  const [recentConnections, setRecentConnections] = useState<any[]>([])
  const [suggestedConnections, setSuggestedConnections] = useState<any[]>([])
  const [userBadges, setUserBadges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  const loadDashboardData = useCallback(async () => {
    try {
      const currentUser = await blink.auth.me()
      if (!currentUser) return
      setUser(currentUser)

      // Load user profile
      const profiles = await blink.db.userProfiles.list({
        where: { userId: currentUser.id },
        limit: 1
      })
      
      const profile = profiles.length > 0 ? profiles[0] : null
      setUserProfile(profile)

      // Load user connections
      const connections = await blink.db.connections.list({
        where: {
          OR: [
            { requesterId: currentUser.id, status: 'accepted' },
            { targetId: currentUser.id, status: 'accepted' }
          ]
        }
      })

      // Load user badges
      const badges = await blink.db.userBadges.list({
        where: { userId: currentUser.id }
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
        profile?.name, profile?.role, profile?.micro_bio,
        profile?.superpower, profile?.learning_now, profile?.ask_me_about
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
        where: { NOT: { userId: currentUser.id } },
        limit: 3
      })
      setSuggestedConnections(allProfiles)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshPoints = async () => {
    // Refresh dashboard data to get updated points
    loadDashboardData()
  }

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-mist via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/30 rounded-2xl w-1/3 backdrop-blur-sm"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white/20 rounded-2xl backdrop-blur-sm"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  }

  return (
    <AnimatedPage className="min-h-screen bg-gradient-to-br from-sky-mist via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-semibold text-slate-navy mb-2">
            Welcome back, {userProfile?.name || 'there'}! 👋
          </h1>
          <p className="text-lg text-slate-navy/70 font-light">
            Here's what's happening in your professional network
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <GlassCard hover className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-navy/80">Connections</h3>
                <Users className="h-5 w-5 text-electric-indigo" />
              </div>
              <div className="text-3xl font-semibold text-slate-navy mb-1">{stats.connections}</div>
              <p className="text-xs text-slate-navy/60">+2 from last week</p>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard hover className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-navy/80">Badges Earned</h3>
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <div className="text-3xl font-semibold text-slate-navy mb-1">{stats.badges}</div>
              <p className="text-xs text-slate-navy/60">Keep building your reputation</p>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard hover className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-navy/80">Profile Strength</h3>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-3xl font-semibold text-slate-navy mb-2">{stats.profileCompletion}%</div>
              <div className="w-full bg-white/30 rounded-full h-2">
                <motion.div 
                  className="bg-gradient-to-r from-electric-indigo to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.profileCompletion}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard hover className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-navy/80">Total XP</h3>
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="text-3xl font-semibold text-slate-navy mb-1">{userProfile?.totalPoints || 0}</div>
              <p className="text-xs text-slate-navy/60">Earn more through activities</p>
            </GlassCard>
          </motion.div>
        </motion.div>

        {/* Gamification Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-2xl font-semibold text-slate-navy mb-6 flex items-center">
            🎮 <span className="ml-2">Gamification Hub</span>
          </h2>
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
        </motion.div>

        {/* Team Leaderboard */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <TeamLeaderboard userProfile={userProfile} />
        </motion.div>

        {/* AI-Powered Features */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h2 className="text-2xl font-semibold text-slate-navy mb-6 flex items-center">
            🤖 <span className="ml-2">AI-Powered Networking</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <MatchingSuggestions />
            <NotificationCenter />
          </div>
          <LearningSessions />
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Your Badges */}
          <motion.div variants={itemVariants}>
            <GlassCard className="p-6">
              <div className="flex items-center mb-4">
                <Sparkles className="h-6 w-6 mr-3 text-amber-500" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-navy">Your Badges</h3>
                  <p className="text-sm text-slate-navy/70">Achievements that showcase your expertise</p>
                </div>
              </div>
              {userBadges.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {userBadges.map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      className="glass-badge p-3"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="text-2xl mb-2 block">{badge.iconEmoji}</span>
                      <p className="font-medium text-sm text-slate-navy">{badge.badgeName}</p>
                      <p className="text-xs text-slate-navy/70">{badge.description}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-navy/60">
                  <Award className="h-12 w-12 mx-auto mb-4 text-slate-navy/30" />
                  <p>No badges yet. Start connecting to earn your first badge!</p>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Suggested Connections */}
          <motion.div variants={itemVariants}>
            <GlassCard className="p-6">
              <div className="flex items-center mb-4">
                <Target className="h-6 w-6 mr-3 text-electric-indigo" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-navy">Suggested Connections</h3>
                  <p className="text-sm text-slate-navy/70">People you might want to connect with</p>
                </div>
              </div>
              {suggestedConnections.length > 0 ? (
                <div className="space-y-4">
                  {suggestedConnections.map((profile, index) => (
                    <motion.div 
                      key={profile.id} 
                      className="flex items-center justify-between p-3 bg-white/20 rounded-xl backdrop-blur-sm"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-electric-indigo text-white">
                            {profile.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-navy">{profile.name || 'Unknown'}</p>
                          <p className="text-sm text-slate-navy/70">{profile.role || profile.user_role || 'No role specified'}</p>
                        </div>
                      </div>
                      <Button size="sm" className="glass-button border-electric-indigo text-electric-indigo hover:bg-electric-indigo hover:text-white">
                        Connect
                      </Button>
                    </motion.div>
                  ))}
                  <Button variant="ghost" className="w-full text-electric-indigo hover:bg-electric-indigo/10">
                    View All Suggestions
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-navy/60">
                  <Users className="h-12 w-12 mx-auto mb-4 text-slate-navy/30" />
                  <p>No suggestions available yet. Complete your profile to get better matches!</p>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <GlassCard className="p-6">
              <div className="flex items-center mb-4">
                <BookOpen className="h-6 w-6 mr-3 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-navy">Quick Actions</h3>
                  <p className="text-sm text-slate-navy/70">Things you can do right now</p>
                </div>
              </div>
              <div className="space-y-3">
                <Button variant="ghost" className="w-full justify-start glass-button">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Update your learning goals
                </Button>
                <Button variant="ghost" className="w-full justify-start glass-button">
                  <Users className="h-4 w-4 mr-2" />
                  Browse colleagues by skill
                </Button>
                <Button variant="ghost" className="w-full justify-start glass-button">
                  <Award className="h-4 w-4 mr-2" />
                  Join a community group
                </Button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants}>
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-slate-navy mb-2">Recent Activity</h3>
              <p className="text-sm text-slate-navy/70 mb-4">What's been happening in your network</p>
              <div className="space-y-4">
                <motion.div 
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-2 h-2 bg-electric-indigo rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-slate-navy">You joined SkillBridge!</p>
                    <p className="text-xs text-slate-navy/60">Welcome to the community</p>
                  </div>
                </motion.div>
                {stats.badges > 0 && (
                  <motion.div 
                    className="flex items-start space-x-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-slate-navy">Earned your first badge</p>
                      <p className="text-xs text-slate-navy/60">Keep up the great work!</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </AnimatedPage>
  )
}