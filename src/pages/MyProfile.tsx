import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Edit3, Camera, Award, Users, BookOpen, Star, MessageCircle } from 'lucide-react'
import { blink } from '../blink/client'
import { GlassCard } from '../components/ui/glass-card'
import { AnimatedPage } from '../components/ui/animated-page'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { SkillEndorsements } from '../components/skills/SkillEndorsements'

interface UserProfile {
  id: string
  name: string
  role: string
  micro_bio: string
  working_style: string[]
  skills: string[]
  skill_gap: string
  learning_now: string
  superpower: string
  proud_project: string
  teach_15_min: string
  moodboard_images: string[]
  playlist_link: string
  ask_me_about: string
  prediction: string
  favorite_tools: string[]
  dept_shadow: string
  connection_count: number
}

interface UserBadge {
  badge_name: string
  badge_type: string
  icon_emoji: string
}

export function MyProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  const loadProfile = async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      // Load user profile
      const profiles = await blink.db.userProfiles.list({
        where: { userId: user.id },
        limit: 1
      })

      if (profiles.length > 0) {
        setProfile(profiles[0])
      }

      // Load user badges
      const userBadges = await blink.db.userBadges.list({
        where: { userId: user.id }
      })

      const badgeDetails = await Promise.all(
        userBadges.map(async (ub) => {
          const badge = await blink.db.badges.list({
            where: { id: ub.badgeId },
            limit: 1
          })
          return badge[0]
        })
      )

      setBadges(badgeDetails.filter(Boolean))
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  if (loading) {
    return (
      <AnimatedPage>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AnimatedPage>
    )
  }

  if (!profile) {
    return (
      <AnimatedPage>
        <div className="min-h-screen flex items-center justify-center">
          <GlassCard className="p-8 text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No Profile Found</h2>
            <p className="text-muted-foreground mb-4">Complete your profile setup to get started</p>
            <Button onClick={() => window.location.href = '/profile-setup'}>
              Complete Profile
            </Button>
          </GlassCard>
        </div>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <h1 className="text-3xl font-bold text-slate-navy">My Profile</h1>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              className="glass-button"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </Button>
          </motion.div>

          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-8">
              <div className="flex items-start space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-navy">{profile.name || 'Unknown User'}</h2>
                  <p className="text-lg text-muted-foreground mb-2">{profile.role || profile.user_role || 'No role specified'}</p>
                  <p className="text-slate-navy mb-4">{profile.micro_bio}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {profile.connection_count} connections
                    </div>
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-1" />
                      {badges.length} badges
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-slate-navy mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Achievements & Badges
              </h3>
              <div className="flex flex-wrap gap-3">
                {badges.map((badge, index) => (
                  <motion.div
                    key={badge.badge_name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Badge variant="secondary" className="glass-badge text-sm py-2 px-4">
                      <span className="mr-2">{badge.icon_emoji}</span>
                      {badge.badge_name}
                    </Badge>
                  </motion.div>
                ))}
                {badges.length === 0 && (
                  <p className="text-muted-foreground">Complete activities to earn badges!</p>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Skills & Expertise */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-slate-navy mb-4 flex items-center">
                <Star className="h-5 w-5 mr-2" />
                Skills & Expertise
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-slate-navy mb-2">Current Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="glass-badge">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-navy mb-2">Learning Now</h4>
                  <p className="text-muted-foreground">{profile.learning_now}</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-navy mb-2">Skill Gap</h4>
                  <p className="text-muted-foreground">{profile.skill_gap}</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-navy mb-2">Superpower</h4>
                  <p className="text-muted-foreground">{profile.superpower}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Professional Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-slate-navy mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Professional Details
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-slate-navy mb-2">Working Style</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.working_style.map((style, index) => (
                      <Badge key={index} variant="secondary" className="glass-badge">
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-navy mb-2">I could teach in 15 minutes</h4>
                  <p className="text-muted-foreground">{profile.teach_15_min}</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-navy mb-2">Ask me about</h4>
                  <p className="text-muted-foreground">{profile.ask_me_about}</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-navy mb-2">Favorite Tools</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.favorite_tools.map((tool, index) => (
                      <Badge key={index} variant="outline" className="glass-badge">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-navy mb-2">Proud Project</h4>
                  <p className="text-muted-foreground">{profile.proud_project}</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-navy mb-2">2024 Prediction</h4>
                  <p className="text-muted-foreground">{profile.prediction}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Skill Endorsements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-slate-navy mb-4 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Skill Endorsements
              </h3>
              <SkillEndorsements />
            </GlassCard>
          </motion.div>

          {/* Moodboard & Playlist */}
          {(profile.moodboard_images.length > 0 || profile.playlist_link) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold text-slate-navy mb-4">Personal Touch</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {profile.moodboard_images.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-navy mb-2">Moodboard</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {profile.moodboard_images.slice(0, 6).map((image, index) => (
                          <div
                            key={index}
                            className="aspect-square bg-muted rounded-lg overflow-hidden"
                          >
                            <img
                              src={image}
                              alt={`Moodboard ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.playlist_link && (
                    <div>
                      <h4 className="font-medium text-slate-navy mb-2">Playlist</h4>
                      <a
                        href={profile.playlist_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        🎵 Listen to my work playlist
                      </a>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </div>
    </AnimatedPage>
  )
}