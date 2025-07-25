import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Users, Star, MessageCircle, UserPlus, Sparkles } from 'lucide-react'
import { blink } from '../blink/client'
import { GlassCard } from '../components/ui/glass-card'
import { AnimatedPage } from '../components/ui/animated-page'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

interface UserProfile {
  id: string
  user_id: string
  name: string
  role: string
  micro_bio: string
  working_style: string[]
  skills: string[]
  skill_gap: string
  learning_now: string
  superpower: string
  teach_15_min: string
  ask_me_about: string
  connection_count: number
}

interface SkillTag {
  id: string
  name: string
  category: string
  color: string
}

export function DiscoverConnections() {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<UserProfile[]>([])
  const [skills, setSkills] = useState<SkillTag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  const filterProfiles = useCallback(() => {
    let filtered = profiles

    if (searchTerm) {
      filtered = filtered.filter(profile =>
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.micro_bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (selectedSkill) {
      filtered = filtered.filter(profile =>
        profile.skills.includes(selectedSkill)
      )
    }

    if (selectedDepartment) {
      filtered = filtered.filter(profile =>
        profile.role.toLowerCase().includes(selectedDepartment.toLowerCase())
      )
    }

    setFilteredProfiles(filtered)
  }, [profiles, searchTerm, selectedSkill, selectedDepartment])

  const loadData = async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return
      setCurrentUser(user)

      // Load all profiles except current user
      const allProfiles = await blink.db.userProfiles.list({
        limit: 100
      })
      
      const otherProfiles = allProfiles.filter(p => p.user_id !== user.id)
      setProfiles(otherProfiles)
      setFilteredProfiles(otherProfiles)

      // Load skills
      const skillTags = await blink.db.skillTags.list({
        limit: 100
      })
      setSkills(skillTags)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterProfiles()
  }, [filterProfiles])

  const sendConnectionRequest = async (targetUserId: string) => {
    try {
      if (!currentUser) return

      await blink.db.connections.create({
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requester_id: currentUser.id,
        target_id: targetUserId,
        status: 'pending',
        created_at: new Date().toISOString()
      })

      // Add notification
      await blink.db.notifications.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: targetUserId,
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${currentUser.email} wants to connect with you`,
        is_read: false,
        created_at: new Date().toISOString()
      })

      // Add points for sending connection request
      await blink.db.points.create({
        id: `points_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: currentUser.id,
        action_type: 'connect',
        points: 5,
        timestamp: new Date().toISOString()
      })

      alert('Connection request sent!')
    } catch (error) {
      console.error('Error sending connection request:', error)
      alert('Failed to send connection request')
    }
  }

  const getCompatibilityScore = (profile: UserProfile) => {
    if (!currentUser) return 0
    
    // Simple compatibility algorithm based on skills overlap
    const userSkills = profile.skills || []
    const commonSkills = userSkills.length
    const maxScore = Math.max(commonSkills * 10, 50)
    return Math.min(maxScore, 95)
  }

  if (loading) {
    return (
      <AnimatedPage>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold text-slate-navy mb-2">Discover Connections</h1>
            <p className="text-muted-foreground">Find colleagues to learn from and collaborate with</p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by name, role, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 glass-input"
                  />
                </div>
                <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Filter by skill" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Skills</SelectItem>
                    {skills.map((skill) => (
                      <SelectItem key={skill.id} value={skill.name}>
                        {skill.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Departments</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="glass-button">
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced
                </Button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Results Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between"
          >
            <p className="text-muted-foreground">
              Found {filteredProfiles.length} colleagues
            </p>
            <Button variant="outline" className="glass-button">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Suggestions
            </Button>
          </motion.div>

          {/* Profile Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -5 }}
              >
                <GlassCard className="p-6 h-full hover:shadow-xl transition-all duration-300">
                  <div className="space-y-4">
                    {/* Profile Header */}
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
                        {profile.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-navy truncate">{profile.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{profile.role}</p>
                        <div className="flex items-center mt-1">
                          <Star className="h-3 w-3 text-accent mr-1" />
                          <span className="text-xs text-accent font-medium">
                            {getCompatibilityScore(profile)}% match
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {profile.micro_bio}
                    </p>

                    {/* Skills */}
                    <div>
                      <h4 className="text-xs font-medium text-slate-navy mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {profile.skills.slice(0, 3).map((skill, skillIndex) => (
                          <Badge key={skillIndex} variant="secondary" className="text-xs glass-badge">
                            {skill}
                          </Badge>
                        ))}
                        {profile.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs glass-badge">
                            +{profile.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Teaching */}
                    {profile.teach_15_min && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-navy mb-1">Can teach</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {profile.teach_15_min}
                        </p>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {profile.connection_count} connections
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {profile.ask_me_about ? 'Available' : 'Busy'}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => sendConnectionRequest(profile.user_id)}
                        className="flex-1 glass-button"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Connect
                      </Button>
                      <Button size="sm" variant="outline" className="glass-button">
                        View
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {filteredProfiles.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="p-12 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold text-slate-navy mb-2">No colleagues found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or explore different skills
                </p>
                <Button onClick={() => {
                  setSearchTerm('')
                  setSelectedSkill('')
                  setSelectedDepartment('')
                }} className="glass-button">
                  Clear Filters
                </Button>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </div>
    </AnimatedPage>
  )
}