import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Checkbox } from '../components/ui/checkbox'
import { GlassCard } from '../components/ui/glass-card'
import { AnimatedPage } from '../components/ui/animated-page'
import { useToast } from '../hooks/use-toast'
import { blink } from '../blink/client'
import { Sparkles, Plus, X, User, Briefcase, Target, Lightbulb } from 'lucide-react'

interface ProfileSetupProps {
  onComplete: () => void
}

const workingStyles = [
  'Collaborative', 'Independent', 'Detail-oriented', 'Big picture', 
  'Fast-paced', 'Methodical', 'Creative', 'Analytical',
  'Hands-on', 'Strategic', 'Flexible', 'Structured'
]

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [skills, setSkills] = useState<any[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    microBio: '',
    workingStyle: [] as string[],
    skillGap: '',
    learningNow: '',
    superpower: '',
    proudProject: '',
    teach15Min: '',
    playlistLink: '',
    askMeAbout: '',
    prediction: '',
    favoriteTools: '',
    deptShadow: ''
  })

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const skillsData = await blink.db.skillTags.list()
        setSkills(skillsData)
      } catch (error) {
        console.error('Error loading skills:', error)
      }
    }
    loadSkills()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleWorkingStyleToggle = (style: string) => {
    setFormData(prev => ({
      ...prev,
      workingStyle: prev.workingStyle.includes(style)
        ? prev.workingStyle.filter(s => s !== style)
        : [...prev.workingStyle, style]
    }))
  }

  const handleSkillToggle = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const user = await blink.auth.me()
      if (!user) return

      // Create user profile
      const profileId = `profile_${Date.now()}`
      await blink.db.userProfiles.create({
        id: profileId,
        user_id: user.id,
        name: formData.name,
        role: formData.role,
        microBio: formData.microBio,
        workingStyle: JSON.stringify(formData.workingStyle),
        skillGap: formData.skillGap,
        learningNow: formData.learningNow,
        superpower: formData.superpower,
        proudProject: formData.proudProject,
        teach15Min: formData.teach15Min,
        playlistLink: formData.playlistLink,
        askMeAbout: formData.askMeAbout,
        prediction: formData.prediction,
        favoriteTools: formData.favoriteTools,
        deptShadow: formData.deptShadow,
        profileVisibility: true,
        connectionCount: 0
      })

      // Add selected skills
      for (const skillId of selectedSkills) {
        await blink.db.userSkills.create({
          id: `user_skill_${Date.now()}_${skillId}`,
          user_id: user.id,
          skill_tag_id: skillId,
          proficiency_level: 3 // Default to intermediate
        })
      }

      // Auto-assign some badges based on profile
      const badgesToAssign = []
      if (selectedSkills.length >= 5) {
        badgesToAssign.push('badge_1') // Code Wizard
      }
      if (formData.teach15Min) {
        badgesToAssign.push('badge_7') // Knowledge Sharer
      }

      for (const badgeId of badgesToAssign) {
        await blink.db.userBadges.create({
          id: `user_badge_${Date.now()}_${badgeId}`,
          user_id: user.id,
          badge_id: badgeId
        })
      }

      toast({
        title: "Profile created successfully!",
        description: "Welcome to SkillBridge. Let's start connecting!",
      })

      onComplete()
    } catch (error) {
      console.error('Error creating profile:', error)
      toast({
        title: "Error creating profile",
        description: "Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-indigo-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">Create Your Profile</h1>
          </div>
          <p className="text-lg text-gray-600">
            Let's build your professional identity and start connecting with colleagues
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Tell us about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role/Title *</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    placeholder="Software Engineer, Designer, etc."
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="microBio">Micro Bio</Label>
                <Textarea
                  id="microBio"
                  value={formData.microBio}
                  onChange={(e) => handleInputChange('microBio', e.target.value)}
                  placeholder="A brief description of yourself (2-3 sentences)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Working Style */}
          <Card>
            <CardHeader>
              <CardTitle>Working Style</CardTitle>
              <CardDescription>How do you prefer to work? (Select all that apply)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {workingStyles.map((style) => (
                  <div key={style} className="flex items-center space-x-2">
                    <Checkbox
                      id={style}
                      checked={formData.workingStyle.includes(style)}
                      onCheckedChange={() => handleWorkingStyleToggle(style)}
                    />
                    <Label htmlFor={style} className="text-sm">{style}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
              <CardDescription>Select your skills and areas of expertise</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {skills.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant={selectedSkills.includes(skill.id) ? "default" : "outline"}
                    className="cursor-pointer justify-center py-2 hover:bg-indigo-100"
                    onClick={() => handleSkillToggle(skill.id)}
                  >
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Professional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
              <CardDescription>Share more about your work and interests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="superpower">Your Superpower</Label>
                  <Input
                    id="superpower"
                    value={formData.superpower}
                    onChange={(e) => handleInputChange('superpower', e.target.value)}
                    placeholder="What are you exceptionally good at?"
                  />
                </div>
                <div>
                  <Label htmlFor="learningNow">Currently Learning</Label>
                  <Input
                    id="learningNow"
                    value={formData.learningNow}
                    onChange={(e) => handleInputChange('learningNow', e.target.value)}
                    placeholder="What are you learning right now?"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="skillGap">Skill Gap to Fill</Label>
                <Textarea
                  id="skillGap"
                  value={formData.skillGap}
                  onChange={(e) => handleInputChange('skillGap', e.target.value)}
                  placeholder="What skills would you like to develop?"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="teach15Min">I Could Teach Someone in 15 Minutes</Label>
                <Input
                  id="teach15Min"
                  value={formData.teach15Min}
                  onChange={(e) => handleInputChange('teach15Min', e.target.value)}
                  placeholder="What could you quickly teach someone?"
                />
              </div>
              <div>
                <Label htmlFor="askMeAbout">Ask Me About</Label>
                <Input
                  id="askMeAbout"
                  value={formData.askMeAbout}
                  onChange={(e) => handleInputChange('askMeAbout', e.target.value)}
                  placeholder="Topics you love discussing"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="px-8">
              {loading ? 'Creating Profile...' : 'Complete Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}