import { useState, useEffect } from 'react'
import { Toaster } from '@/components/ui/toaster'
import blink from '@/blink/client'
import Dashboard from '@/pages/Dashboard'
import ProfileSetup from '@/pages/ProfileSetup'
import DiscoverConnections from '@/pages/DiscoverConnections'
import MyProfile from '@/pages/MyProfile'
import Connections from '@/pages/Connections'
import CommunityGroups from '@/pages/CommunityGroups'
import Navigation from '@/components/Navigation'
import LoadingScreen from '@/components/LoadingScreen'

type Page = 'dashboard' | 'profile-setup' | 'discover' | 'my-profile' | 'connections' | 'groups'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const checkUserProfile = async () => {
      if (user) {
        try {
          const profiles = await blink.db.userProfiles.list({
            where: { userId: user.id },
            limit: 1
          })
          
          if (profiles.length > 0) {
            setUserProfile(profiles[0])
          } else {
            // New user, redirect to profile setup
            setCurrentPage('profile-setup')
          }
        } catch (error) {
          console.error('Error checking user profile:', error)
        }
      }
    }

    checkUserProfile()
  }, [user])

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to SkillBridge</h1>
          <p className="text-lg text-gray-600 mb-8">Connect, learn, and grow with your colleagues</p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Sign In to Get Started
          </button>
        </div>
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'profile-setup':
        return <ProfileSetup user={user} onComplete={() => setCurrentPage('dashboard')} />
      case 'discover':
        return <DiscoverConnections user={user} />
      case 'my-profile':
        return <MyProfile user={user} userProfile={userProfile} />
      case 'connections':
        return <Connections user={user} />
      case 'groups':
        return <CommunityGroups user={user} />
      default:
        return <Dashboard user={user} userProfile={userProfile} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        user={user}
        userProfile={userProfile}
      />
      <main className="pt-16">
        {renderPage()}
      </main>
      <Toaster />
    </div>
  )
}

export default App