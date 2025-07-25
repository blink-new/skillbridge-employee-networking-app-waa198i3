import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Search, Filter, Users, MessageCircle } from 'lucide-react'
import blink from '@/blink/client'

interface DiscoverConnectionsProps {
  user: any
}

const DiscoverConnections = ({ user }: DiscoverConnectionsProps) => {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const allProfiles = await blink.db.userProfiles.list({
          where: { NOT: { userId: user.id } }
        })
        setProfiles(allProfiles)
      } catch (error) {
        console.error('Error loading profiles:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfiles()
  }, [user])

  const filteredProfiles = profiles.filter(profile =>
    profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.role?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Connections</h1>
        <p className="text-lg text-gray-600">
          Find colleagues to learn from, collaborate with, and grow together
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, role, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Results */}
      {filteredProfiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {profile.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{profile.name}</CardTitle>
                    <CardDescription>{profile.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.microBio && (
                    <p className="text-sm text-gray-600">{profile.microBio}</p>
                  )}
                  
                  {profile.superpower && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Superpower</p>
                      <Badge variant="secondary">{profile.superpower}</Badge>
                    </div>
                  )}

                  {profile.learningNow && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Currently Learning</p>
                      <p className="text-sm">{profile.learningNow}</p>
                    </div>
                  )}

                  {profile.askMeAbout && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Ask Me About</p>
                      <p className="text-sm">{profile.askMeAbout}</p>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-4">
                    <Button size="sm" className="flex-1">
                      <Users className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                    <Button size="sm" variant="outline">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No connections found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'Be the first to create a profile!'}
          </p>
        </div>
      )}
    </div>
  )
}

export default DiscoverConnections