import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!streakData) return null

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600'
    if (streak >= 14) return 'text-orange-600'
    if (streak >= 7) return 'text-red-600'
    return 'text-gray-600'
  }

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥🔥🔥'
    if (streak >= 14) return '🔥🔥'
    if (streak >= 7) return '🔥'
    return '💫'
  }

  return (
    <Card className="w-full bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-orange-600" />
          Connection Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getStreakColor(streakData.currentStreak)}`}>
              {streakData.currentStreak}
            </div>
            <div className="text-sm text-gray-600">Current Streak</div>
            <div className="text-lg">{getStreakEmoji(streakData.currentStreak)}</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-semibold text-purple-600">
              {streakData.bestStreak}
            </div>
            <div className="text-sm text-gray-600">Best Streak</div>
            <Trophy className="h-5 w-5 text-purple-600 mx-auto mt-1" />
          </div>
        </div>

        {streakData.daysUntilStreakBreak > 0 && streakData.currentStreak > 0 && (
          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span className="text-gray-700">
                {streakData.daysUntilStreakBreak} days left to maintain streak
              </span>
            </div>
          </div>
        )}

        {streakData.currentStreak === 0 && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Make a new connection to start your streak!
            </p>
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Connect within 7 days to maintain
            </Badge>
          </div>
        )}

        {streakData.currentStreak >= 7 && (
          <Badge className="w-full justify-center bg-orange-600 hover:bg-orange-700">
            🔥 Streak Master! Keep it going!
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}