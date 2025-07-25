import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Edit, Award, Users, BookOpen, Target, Sparkles } from 'lucide-react'
import blink from '@/blink/client'
import { SkillEndorsements } from '@/components/skills/SkillEndorsements'

interface MyProfileProps {
  user: any
  userProfile: any
}

const MyProfile = ({ user, userProfile }: MyProfileProps) => {
  const [userSkills, setUserSkills] = useState<any[]>([])
  const [userBadges, setUserBadges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return

      try {
        // Load user skills
        const skills = await blink.db.userSkills.list({
          where: { userId: user.id }
        })

        // Load skill details
        const skillDetails = []
        for (const userSkill of skills) {
          const skill = await blink.db.skillTags.list({
            where: { id: userSkill.skillTagId },
            limit: 1
          })
          if (skill.length > 0) {
            skillDetails.push({
              ...skill[0],
              proficiency: userSkill.proficiencyLevel
            })
          }
        }

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
            badgeDetails.push({
              ...badge[0],
              earnedAt: userBadge.earnedAt
            })
          }
        }

        setUserSkills(skillDetails)
        setUserBadges(badgeDetails)
      } catch (error) {
        console.error('Error loading profile data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [user])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const workingStyles = userProfile?.workingStyle ? JSON.parse(userProfile.workingStyle) : []
  const favoriteTools = userProfile?.favoriteTools ? userProfile.favoriteTools.split(',') : []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.avatar} alt={userProfile?.name} />
              <AvatarFallback className="text-2xl">
                {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{userProfile?.name}</h1>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
              <p className="text-xl text-gray-600 mb-2">{userProfile?.role}</p>
              {userProfile?.microBio && (
                <p className="text-gray-700">{userProfile.microBio}</p>
              )}
              <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {userProfile?.connectionCount || 0} connections
                </div>
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  {userBadges.length} badges
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Skills & Expertise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-indigo-500" />
              Skills & Expertise
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userSkills.length > 0 ? (
              <div className="space-y-3">
                {userSkills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between">
                    <Badge 
                      style={{ backgroundColor: skill.color + '20', color: skill.color }}
                      className="border-0"
                    >
                      {skill.name}
                    </Badge>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`w-2 h-2 rounded-full mr-1 ${
                            level <= skill.proficiency ? 'bg-indigo-500' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No skills added yet</p>
            )}
          </CardContent>
        </Card>

        {/* Badges & Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-amber-500" />
              Badges & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userBadges.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
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
              <p className="text-gray-500">No badges earned yet</p>
            )}
          </CardContent>
        </Card>

        {/* Professional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-green-500" />
              Professional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userProfile?.superpower && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">Superpower</h4>
                <p className="text-sm">{userProfile.superpower}</p>
              </div>
            )}
            
            {userProfile?.learningNow && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">Currently Learning</h4>
                <p className="text-sm">{userProfile.learningNow}</p>
              </div>
            )}

            {userProfile?.skillGap && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">Skills to Develop</h4>
                <p className="text-sm">{userProfile.skillGap}</p>
              </div>
            )}

            {userProfile?.teach15Min && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">I Could Teach in 15 Minutes</h4>
                <p className="text-sm">{userProfile.teach15Min}</p>
              </div>
            )}

            {userProfile?.askMeAbout && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">Ask Me About</h4>
                <p className="text-sm">{userProfile.askMeAbout}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Working Style & Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Working Style & Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workingStyles.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Working Style</h4>
                <div className="flex flex-wrap gap-2">
                  {workingStyles.map((style: string) => (
                    <Badge key={style} variant="outline">{style}</Badge>
                  ))}
                </div>
              </div>
            )}

            {userProfile?.proudProject && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">Proud Project</h4>
                <p className="text-sm">{userProfile.proudProject}</p>
              </div>
            )}

            {userProfile?.prediction && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">Industry Prediction</h4>
                <p className="text-sm">{userProfile.prediction}</p>
              </div>
            )}

            {userProfile?.deptShadow && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">Department to Shadow</h4>
                <p className="text-sm">{userProfile.deptShadow}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Skill Endorsements */}
      <div className="mt-8">
        <SkillEndorsements userId={user?.id} isOwnProfile={true} />
      </div>
    </div>
  )
}

export default MyProfile