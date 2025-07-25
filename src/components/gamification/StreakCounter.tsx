import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { Flame, Calendar, Trophy } from 'lucide-react'
import { blink } from '@/blink/client'

interface StreakData {
  currentStreak: number
  bestStreak: number
  lastConnectionDate: number | null
  daysUntilStreakBreak: number
}

export function StreakCounter() {
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStreakData = async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      // Get user streak data
      const streaks = await blink.db.userStreaks.list({
        where: { userId: user.id },
        limit: 1
      })

      let streakRecord = streaks[0]
      
      if (!streakRecord) {
        // Create initial streak record
        streakRecord = await blink.db.userStreaks.create({
          userId: user.id,
          currentStreak: 0,
          bestStreak: 0,
          lastConnectionDate: null
        })
      }

      // Calculate days until streak break
      const now = Date.now()
      const daysSinceLastConnection = streakRecord.lastConnectionDate 
        ? Math.floor((now - streakRecord.lastConnectionDate) / (1000 * 60 * 60 * 24))
        : 999

      const daysUntilBreak = Math.max(0, 7 - daysSinceLastConnection)

      setStreakData({
        currentStreak: Number(streakRecord.currentStreak) || 0,
        bestStreak: Number(streakRecord.bestStreak) || 0,
        lastConnectionDate: streakRecord.lastConnectionDate,
        daysUntilStreakBreak: daysUntilBreak
      })
    } catch (error) {
      console.error('Error loading streak data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStreakData()
  }, [])

  const updateStreak = async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      const now = Date.now()
      
      // Get recent connections
      const recentConnections = await blink.db.connections.list({
        where: { 
          AND: [
            { userId: user.id },
            { status: 'accepted' }
          ]
        },
        orderBy: { createdAt: 'desc' },
        limit: 1
      })

      if (recentConnections.length > 0) {
        const lastConnection = recentConnections[0]
        const daysSinceConnection = Math.floor((now - lastConnection.createdAt) / (1000 * 60 * 60 * 24))

        if (daysSinceConnection <= 7) {
          // Update streak
          const currentStreak = (streakData?.currentStreak || 0) + 1
          const bestStreak = Math.max(currentStreak, streakData?.bestStreak || 0)

          await blink.db.userStreaks.update(user.id, {
            currentStreak,
            bestStreak,
            lastConnectionDate: now
          })

          // Award streak badge if reached 7 days
          if (currentStreak >= 7) {
            await blink.db.points.create({
              userId: user.id,
              actionType: 'streak',
              points: 50,
              metadata: JSON.stringify({ streakLength: currentStreak })
            })
          }

          loadStreakData()
        }
      }
    } catch (error) {
      console.error('Error updating streak:', error)
    }
  }

  if (loading) {
    return (
      <GlassCard className="w-full p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/30 rounded w-1/2"></div>
          <div className="h-8 bg-white/30 rounded w-1/3"></div>
        </div>
      </GlassCard>
    )
  }

  if (!streakData) return null

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600'
    if (streak >= 14) return 'text-orange-600'
    if (streak >= 7) return 'text-red-600'
    return 'text-slate-navy'
  }

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥🔥🔥'
    if (streak >= 14) return '🔥🔥'
    if (streak >= 7) return '🔥'
    return '💫'
  }

  return (
    <GlassCard className="w-full p-6 bg-gradient-to-br from-orange-100/20 to-red-100/20">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-slate-navy">Connection Streak</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <motion.div 
            className="text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className={`text-3xl font-bold ${getStreakColor(streakData.currentStreak)}`}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {streakData.currentStreak}
            </motion.div>
            <div className="text-sm text-slate-navy/70">Current Streak</div>
            <div className="text-lg">{getStreakEmoji(streakData.currentStreak)}</div>
          </motion.div>
          
          <motion.div 
            className="text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-2xl font-semibold text-purple-600">
              {streakData.bestStreak}
            </div>
            <div className="text-sm text-slate-navy/70">Best Streak</div>
            <Trophy className="h-5 w-5 text-purple-600 mx-auto mt-1" />
          </motion.div>
        </div>

        {streakData.daysUntilStreakBreak > 0 && streakData.currentStreak > 0 && (
          <motion.div 
            className="glass-card p-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span className="text-slate-navy">
                {streakData.daysUntilStreakBreak} days left to maintain streak
              </span>
            </div>
          </motion.div>
        )}

        {streakData.currentStreak === 0 && (
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm text-slate-navy/70 mb-2">
              Make a new connection to start your streak!
            </p>
            <Badge variant="outline" className="text-orange-600 border-orange-600 glass-badge">
              Connect within 7 days to maintain
            </Badge>
          </motion.div>
        )}

        {streakData.currentStreak >= 7 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="w-full justify-center bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
              🔥 Streak Master! Keep it going!
            </Badge>
          </motion.div>
        )}
      </div>
    </GlassCard>
  )
}