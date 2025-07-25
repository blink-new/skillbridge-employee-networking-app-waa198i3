import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, UserCheck, UserX, Clock, MessageCircle, UserPlus, CheckCircle } from 'lucide-react'
import { blink } from '../blink/client'
import { GlassCard } from '../components/ui/glass-card'
import { AnimatedPage } from '../components/ui/animated-page'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { ChatWindow } from '../components/messaging/ChatWindow'

interface Connection {
  id: string
  user_id: string
  name: string
  role: string
  micro_bio: string
  superpower: string
  skills: string[]
  connection_count: number
  connected_at?: string
  request_id?: string
  message?: string
}

export function Connections() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([])
  const [sentRequests, setSentRequests] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatRecipient, setChatRecipient] = useState<{ id: string; name: string } | null>(null)

  const loadData = async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return
      setCurrentUser(user)

      // Load accepted connections
      const acceptedConnections = await blink.db.connections.list({
        where: { status: 'accepted' },
        limit: 100
      })

      const userConnections = acceptedConnections.filter(conn =>
        conn.requester_id === user.id || conn.target_id === user.id
      )

      // Load pending requests (received)
      const pending = await blink.db.connections.list({
        where: { target_id: user.id, status: 'pending' },
        limit: 100
      })

      // Load sent requests
      const sent = await blink.db.connections.list({
        where: { requester_id: user.id, status: 'pending' },
        limit: 100
      })

      // Get profile details for connections
      const connectionProfiles = []
      for (const connection of userConnections) {
        const otherUserId = connection.requester_id === user.id ? connection.target_id : connection.requester_id
        const profiles = await blink.db.userProfiles.list({
          where: { user_id: otherUserId },
          limit: 1
        })
        if (profiles.length > 0) {
          connectionProfiles.push({
            ...profiles[0],
            connection_id: connection.id,
            connected_at: connection.created_at
          })
        }
      }

      // Get profile details for pending requests
      const pendingProfiles = []
      for (const request of pending) {
        const profiles = await blink.db.userProfiles.list({
          where: { user_id: request.requester_id },
          limit: 1
        })
        if (profiles.length > 0) {
          pendingProfiles.push({
            ...profiles[0],
            request_id: request.id,
            message: request.message || '',
            requested_at: request.created_at
          })
        }
      }

      // Get profile details for sent requests
      const sentProfiles = []
      for (const request of sent) {
        const profiles = await blink.db.userProfiles.list({
          where: { user_id: request.target_id },
          limit: 1
        })
        if (profiles.length > 0) {
          sentProfiles.push({
            ...profiles[0],
            request_id: request.id,
            message: request.message || '',
            sent_at: request.created_at
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

  useEffect(() => {
    loadData()
  }, [])

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await blink.db.connections.update(requestId, {
        status: 'accepted'
      })

      // Add points for accepting connection
      if (currentUser) {
        await blink.db.points.create({
          id: `points_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: currentUser.id,
          action_type: 'connect',
          points: 10,
          timestamp: new Date().toISOString()
        })
      }

      loadData() // Refresh data
    } catch (error) {
      console.error('Error accepting request:', error)
    }
  }

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await blink.db.connections.update(requestId, {
        status: 'declined'
      })
      loadData() // Refresh data
    } catch (error) {
      console.error('Error declining request:', error)
    }
  }

  const openChat = (userId: string, userName: string) => {
    setChatRecipient({ id: userId, name: userName })
    setChatOpen(true)
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
            <h1 className="text-3xl font-bold text-slate-navy mb-2">My Connections</h1>
            <p className="text-muted-foreground">Manage your professional network and connection requests</p>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Tabs defaultValue="connections" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 glass-card">
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
                    {connections.map((connection, index) => (
                      <motion.div
                        key={connection.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ y: -5 }}
                      >
                        <GlassCard className="p-6 h-full hover:shadow-xl transition-all duration-300">
                          <div className="space-y-4">
                            {/* Profile Header */}
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
                                {connection.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-navy truncate">{connection.name}</h3>
                                <p className="text-sm text-muted-foreground truncate">{connection.role}</p>
                              </div>
                            </div>

                            {/* Bio */}
                            {connection.micro_bio && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {connection.micro_bio}
                              </p>
                            )}

                            {/* Superpower */}
                            {connection.superpower && (
                              <div>
                                <h4 className="text-xs font-medium text-slate-navy mb-1">Superpower</h4>
                                <Badge variant="secondary" className="glass-badge">
                                  {connection.superpower}
                                </Badge>
                              </div>
                            )}

                            {/* Skills */}
                            {connection.skills && connection.skills.length > 0 && (
                              <div>
                                <h4 className="text-xs font-medium text-slate-navy mb-2">Skills</h4>
                                <div className="flex flex-wrap gap-1">
                                  {connection.skills.slice(0, 3).map((skill, skillIndex) => (
                                    <Badge key={skillIndex} variant="outline" className="text-xs glass-badge">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {connection.skills.length > 3 && (
                                    <Badge variant="outline" className="text-xs glass-badge">
                                      +{connection.skills.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Status */}
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                                Connected
                              </div>
                              <Button
                                size="sm"
                                onClick={() => openChat(connection.user_id, connection.name)}
                                className="glass-button"
                              >
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Chat
                              </Button>
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <GlassCard className="p-12 text-center">
                      <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold text-slate-navy mb-2">No connections yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start building your network by connecting with colleagues
                      </p>
                      <Button className="glass-button">Discover People</Button>
                    </GlassCard>
                  </motion.div>
                )}
              </TabsContent>

              {/* Pending Requests Tab */}
              <TabsContent value="pending">
                {pendingRequests.length > 0 ? (
                  <div className="space-y-4">
                    {pendingRequests.map((request, index) => (
                      <motion.div
                        key={request.request_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <GlassCard className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
                                {request.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <h3 className="font-medium text-slate-navy">{request.name}</h3>
                                <p className="text-sm text-muted-foreground">{request.role}</p>
                                {request.message && (
                                  <p className="text-sm text-slate-navy mt-1 italic">"{request.message}"</p>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptRequest(request.request_id!)}
                                className="glass-button"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeclineRequest(request.request_id!)}
                                className="glass-button"
                              >
                                <UserX className="h-3 w-3 mr-1" />
                                Decline
                              </Button>
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <GlassCard className="p-12 text-center">
                      <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold text-slate-navy mb-2">No pending requests</h3>
                      <p className="text-muted-foreground">
                        You'll see connection requests from other users here
                      </p>
                    </GlassCard>
                  </motion.div>
                )}
              </TabsContent>

              {/* Sent Requests Tab */}
              <TabsContent value="sent">
                {sentRequests.length > 0 ? (
                  <div className="space-y-4">
                    {sentRequests.map((request, index) => (
                      <motion.div
                        key={request.request_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <GlassCard className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
                                {request.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <h3 className="font-medium text-slate-navy">{request.name}</h3>
                                <p className="text-sm text-muted-foreground">{request.role}</p>
                                {request.message && (
                                  <p className="text-sm text-slate-navy mt-1 italic">Your message: "{request.message}"</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              Pending
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <GlassCard className="p-12 text-center">
                      <UserPlus className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold text-slate-navy mb-2">No sent requests</h3>
                      <p className="text-muted-foreground">
                        Connection requests you send will appear here
                      </p>
                    </GlassCard>
                  </motion.div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>

      {/* Chat Window */}
      {chatRecipient && (
        <ChatWindow
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          recipientId={chatRecipient.id}
          recipientName={chatRecipient.name}
        />
      )}
    </AnimatedPage>
  )
}