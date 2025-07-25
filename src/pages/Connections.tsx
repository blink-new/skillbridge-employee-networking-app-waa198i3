import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, UserPlus, Clock, CheckCircle, MessageCircle } from 'lucide-react'
import blink from '@/blink/client'

interface ConnectionsProps {
  user: any
}

const Connections = ({ user }: ConnectionsProps) => {
  const [connections, setConnections] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadConnections = async () => {
      if (!user) return

      try {
        // Load accepted connections
        const acceptedConnections = await blink.db.connections.list({
          where: {
            OR: [
              { requesterId: user.id, status: 'accepted' },
              { recipientId: user.id, status: 'accepted' }
            ]
          }
        })

        // Load pending requests (received)
        const pending = await blink.db.connections.list({
          where: { recipientId: user.id, status: 'pending' }
        })

        // Load sent requests
        const sent = await blink.db.connections.list({
          where: { requesterId: user.id, status: 'pending' }
        })

        // Get profile details for connections
        const connectionProfiles = []
        for (const connection of acceptedConnections) {
          const otherUserId = connection.requesterId === user.id ? connection.recipientId : connection.requesterId
          const profiles = await blink.db.userProfiles.list({
            where: { userId: otherUserId },
            limit: 1
          })
          if (profiles.length > 0) {
            connectionProfiles.push({
              ...profiles[0],
              connectionId: connection.id,
              connectedAt: connection.updatedAt
            })
          }
        }

        // Get profile details for pending requests
        const pendingProfiles = []
        for (const request of pending) {
          const profiles = await blink.db.userProfiles.list({
            where: { userId: request.requesterId },
            limit: 1
          })
          if (profiles.length > 0) {
            pendingProfiles.push({
              ...profiles[0],
              requestId: request.id,
              message: request.message,
              requestedAt: request.createdAt
            })
          }
        }

        // Get profile details for sent requests
        const sentProfiles = []
        for (const request of sent) {
          const profiles = await blink.db.userProfiles.list({
            where: { userId: request.recipientId },
            limit: 1
          })
          if (profiles.length > 0) {
            sentProfiles.push({
              ...profiles[0],
              requestId: request.id,
              message: request.message,
              sentAt: request.createdAt
            })
          }
        }

        setConnections(connectionProfiles)
        setPendingRequests(pendingProfiles)
        setSentRequests(sentProfiles)
      } catch (error) {
        console.error('Error loading connections:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConnections()
  }, [user])

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await blink.db.connections.update(requestId, {
        status: 'accepted',
        updatedAt: new Date().toISOString()
      })
      
      // Refresh the data
      window.location.reload()
    } catch (error) {
      console.error('Error accepting request:', error)
    }
  }

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await blink.db.connections.update(requestId, {
        status: 'declined',
        updatedAt: new Date().toISOString()
      })
      
      // Refresh the data
      window.location.reload()
    } catch (error) {
      console.error('Error declining request:', error)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Connections</h1>
        <p className="text-lg text-gray-600">
          Manage your professional network and connection requests
        </p>
      </div>

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connections" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Connections ({connections.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center">
            <UserPlus className="h-4 w-4 mr-2" />
            Sent ({sentRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Connections Tab */}
        <TabsContent value="connections">
          {connections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connections.map((connection) => (
                <Card key={connection.connectionId} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {connection.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{connection.name}</CardTitle>
                        <CardDescription>{connection.role}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {connection.microBio && (
                        <p className="text-sm text-gray-600">{connection.microBio}</p>
                      )}
                      
                      {connection.superpower && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Superpower</p>
                          <Badge variant="secondary">{connection.superpower}</Badge>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3">
                        <div className="flex items-center text-xs text-gray-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </div>
                        <Button size="sm" variant="outline">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
              <p className="text-gray-600 mb-4">
                Start building your network by connecting with colleagues
              </p>
              <Button>Discover People</Button>
            </div>
          )}
        </TabsContent>

        {/* Pending Requests Tab */}
        <TabsContent value="pending">
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.requestId}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {request.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{request.name}</h3>
                          <p className="text-sm text-gray-600">{request.role}</p>
                          {request.message && (
                            <p className="text-sm text-gray-700 mt-1 italic">"{request.message}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleAcceptRequest(request.requestId)}
                        >
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeclineRequest(request.requestId)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
              <p className="text-gray-600">
                You'll see connection requests from other users here
              </p>
            </div>
          )}
        </TabsContent>

        {/* Sent Requests Tab */}
        <TabsContent value="sent">
          {sentRequests.length > 0 ? (
            <div className="space-y-4">
              {sentRequests.map((request) => (
                <Card key={request.requestId}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {request.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{request.name}</h3>
                          <p className="text-sm text-gray-600">{request.role}</p>
                          {request.message && (
                            <p className="text-sm text-gray-700 mt-1 italic">Your message: "{request.message}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        Pending
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserPlus className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sent requests</h3>
              <p className="text-gray-600">
                Connection requests you send will appear here
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Connections