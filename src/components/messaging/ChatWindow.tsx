import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, Smile, Paperclip, Phone, Video } from 'lucide-react'
import { blink } from '../../blink/client'
import { GlassCard } from '../ui/glass-card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  timestamp: string
  is_read: boolean
}

interface ChatWindowProps {
  isOpen: boolean
  onClose: () => void
  recipientId: string
  recipientName: string
}

export function ChatWindow({ isOpen, onClose, recipientId, recipientName }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const getCurrentUser = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      setCurrentUser(user)
    } catch (error) {
      console.error('Error getting current user:', error)
    }
  }, [])

  const loadMessages = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      // Load messages between current user and recipient
      const allMessages = await blink.db.messages.list({
        limit: 100,
        orderBy: { timestamp: 'asc' }
      })

      const conversationMessages = allMessages.filter(msg =>
        (msg.sender_id === user.id && msg.receiver_id === recipientId) ||
        (msg.sender_id === recipientId && msg.receiver_id === user.id)
      )

      setMessages(conversationMessages)

      // Mark messages as read
      const unreadMessages = conversationMessages.filter(
        msg => msg.receiver_id === user.id && !msg.is_read
      )

      for (const msg of unreadMessages) {
        await blink.db.messages.update(msg.id, { is_read: true })
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [recipientId])

  useEffect(() => {
    if (isOpen) {
      loadMessages()
      getCurrentUser()
    }
  }, [isOpen, loadMessages, getCurrentUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return

    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await blink.db.messages.create({
        id: messageId,
        sender_id: currentUser.id,
        receiver_id: recipientId,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        is_read: false
      })

      // Add to local state immediately for optimistic UI
      const newMsg: Message = {
        id: messageId,
        sender_id: currentUser.id,
        receiver_id: recipientId,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        is_read: false
      }

      setMessages(prev => [...prev, newMsg])
      setNewMessage('')

      // Add notification for recipient
      await blink.db.notifications.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: recipientId,
        type: 'message',
        title: 'New Message',
        message: `${currentUser.email} sent you a message`,
        is_read: false,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-4 right-4 w-80 h-96 z-50"
      >
        <GlassCard className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
                {recipientName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="font-medium text-slate-navy">{recipientName}</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Phone className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Video className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Start a conversation with {recipientName}</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.sender_id === currentUser?.id
                const showTime = index === 0 || 
                  new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      {showTime && (
                        <div className="text-xs text-muted-foreground text-center mb-2">
                          {formatTime(message.timestamp)}
                        </div>
                      )}
                      <div
                        className={`px-3 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-primary text-white ml-auto'
                            : 'bg-white/20 backdrop-blur-sm text-slate-navy'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/20">
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Paperclip className="h-4 w-4" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="glass-input pr-10"
                />
                <Button size="sm" variant="ghost" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0">
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                size="sm" 
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="h-8 w-8 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  )
}