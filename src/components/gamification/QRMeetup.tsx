import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { QrCode, Scan, Users, Star } from 'lucide-react'
import { blink } from '@/blink/client'

interface QRMeetupProps {
  userId?: string
}

export function QRMeetup({ userId }: QRMeetupProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [qrCode, setQrCode] = useState<string>('')
  const [scannedUser, setScannedUser] = useState<any>(null)
  const [meetupCount, setMeetupCount] = useState(0)
  const [showScanner, setShowScanner] = useState(false)
  const [showMeetupForm, setShowMeetupForm] = useState(false)

  const loadUserData = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      setCurrentUser(user)
      
      // Generate QR code data (user ID + timestamp for security)
      const qrData = `skillbridge://meet/${user.id}/${Date.now()}`
      setQrCode(qrData)

      // Get meetup count from points
      const meetupPoints = await blink.db.points.list({
        where: { 
          AND: [
            { userId: user.id },
            { actionType: 'meet' }
          ]
        }
      })
      setMeetupCount(meetupPoints.length)
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }, [])

  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  const handleQRScan = async (scannedData: string) => {
    try {
      // Parse QR code data
      const match = scannedData.match(/skillbridge:\/\/meet\/([^/]+)\/(\d+)/)
      if (!match) {
        alert('Invalid QR code')
        return
      }

      const [, scannedUserId] = match
      
      if (scannedUserId === currentUser?.id) {
        alert("You can't scan your own QR code!")
        return
      }

      // Get scanned user profile
      const profiles = await blink.db.userProfiles.list({
        where: { userId: scannedUserId },
        limit: 1
      })

      if (profiles.length === 0) {
        alert('User not found')
        return
      }

      setScannedUser(profiles[0])
      setShowScanner(false)
      setShowMeetupForm(true)
    } catch (error) {
      console.error('Error scanning QR code:', error)
      alert('Error scanning QR code')
    }
  }

  const completeMeetup = async (rating: number, notes: string) => {
    try {
      if (!currentUser || !scannedUser) return

      // Award points for meetup
      await blink.db.points.create({
        userId: currentUser.id,
        actionType: 'meet',
        points: 10,
        metadata: JSON.stringify({
          metWith: scannedUser.userId,
          rating,
          notes
        })
      })

      // Award points to scanned user too
      await blink.db.points.create({
        userId: scannedUser.userId,
        actionType: 'meet',
        points: 10,
        metadata: JSON.stringify({
          metWith: currentUser.id,
          rating,
          notes
        })
      })

      // Check for QR Hunter badge (5+ meetups)
      const totalMeetups = meetupCount + 1
      if (totalMeetups >= 5) {
        // Award QR Hunter badge
        const existingBadges = await blink.db.userBadges.list({
          where: {
            AND: [
              { userId: currentUser.id },
              { badgeId: 'qr_hunter' }
            ]
          }
        })

        if (existingBadges.length === 0) {
          await blink.db.userBadges.create({
            userId: currentUser.id,
            badgeId: 'qr_hunter'
          })
        }
      }

      setMeetupCount(totalMeetups)
      setShowMeetupForm(false)
      setScannedUser(null)
      
      alert('Meetup logged! +10 XP earned 🎉')
    } catch (error) {
      console.error('Error completing meetup:', error)
      alert('Error logging meetup')
    }
  }

  const generateQRCodeSVG = (data: string) => {
    // Simple QR code representation (in real app, use a QR library)
    return (
      <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <QrCode className="h-16 w-16 mx-auto mb-2 text-gray-600" />
          <div className="text-xs text-gray-500 break-all px-2">
            {data.slice(-12)}
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) return null

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <QrCode className="h-5 w-5 text-blue-600" />
          QR Meetups
          <Badge variant="secondary" className="ml-auto">
            {meetupCount} meetups
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-auto py-3 flex-col gap-2">
                <QrCode className="h-6 w-6 text-blue-600" />
                <span className="text-sm">Show My QR</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>My QR Code</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4">
                {generateQRCodeSVG(qrCode)}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Have a colleague scan this to log a meetup!
                  </p>
                  <Badge className="bg-blue-600">+10 XP for both of you</Badge>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            className="h-auto py-3 flex-col gap-2"
            onClick={() => setShowScanner(true)}
          >
            <Scan className="h-6 w-6 text-green-600" />
            <span className="text-sm">Scan QR</span>
          </Button>
        </div>

        {meetupCount >= 5 && (
          <Badge className="w-full justify-center bg-blue-600 hover:bg-blue-700">
            🏆 QR Hunter Badge Unlocked!
          </Badge>
        )}

        <div className="text-center text-sm text-gray-600">
          <Users className="h-4 w-4 inline mr-1" />
          Meet colleagues in person and scan QR codes to earn XP!
        </div>

        {/* Scanner Modal */}
        <Dialog open={showScanner} onOpenChange={setShowScanner}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Scan Colleague's QR Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <Scan className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">Camera scanner would appear here</p>
                <Button 
                  onClick={() => {
                    // Simulate scanning a QR code
                    const mockQR = `skillbridge://meet/user_${Math.random().toString(36).substr(2, 9)}/${Date.now()}`
                    handleQRScan(mockQR)
                  }}
                  variant="outline"
                >
                  Simulate Scan (Demo)
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Meetup Form Modal */}
        <Dialog open={showMeetupForm} onOpenChange={setShowMeetupForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Your Meetup</DialogTitle>
            </DialogHeader>
            {scannedUser && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold">{scannedUser.name}</h3>
                  <p className="text-sm text-gray-600">{scannedUser.role || scannedUser.user_role || 'No role specified'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Rate this meetup:</label>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant="outline"
                        size="sm"
                        onClick={() => completeMeetup(rating, '')}
                        className="p-2"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={() => completeMeetup(5, 'Great meetup!')}
                  className="w-full"
                >
                  Complete Meetup (+10 XP)
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}