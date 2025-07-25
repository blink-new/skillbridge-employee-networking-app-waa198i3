import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from './components/ui/toaster'
import { GlassCard } from './components/ui/glass-card'
import { blink } from './blink/client'
import { Dashboard } from './pages/Dashboard'
import { ProfileSetup } from './pages/ProfileSetup'
import { DiscoverConnections } from './pages/DiscoverConnections'
import { MyProfile } from './pages/MyProfile'
import { Connections } from './pages/Connections'
import { CommunityGroups } from './pages/CommunityGroups'
import { Navigation } from './components/Navigation'
import { LoadingScreen } from './components/LoadingScreen'

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
      <div className="min-h-screen bg-gradient-to-br from-sky-mist via-white to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <GlassCard className="p-12 text-center max-w-md mx-auto">
            <motion.h1 
              className="text-4xl font-semibold text-slate-navy mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Welcome to SkillBridge
            </motion.h1>
            <motion.p 
              className="text-lg text-slate-navy/70 mb-8 font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Connect, learn, and grow with your colleagues
            </motion.p>
            <motion.button
              onClick={() => blink.auth.login()}
              className="glass-button px-8 py-3 rounded-xl font-medium text-electric-indigo border-electric-indigo hover:bg-electric-indigo hover:text-white transition-all duration-300"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign In to Get Started
            </motion.button>
          </GlassCard>
        </motion.div>
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'profile-setup':
        return <ProfileSetup onComplete={() => setCurrentPage('dashboard')} />
      case 'discover':
        return <DiscoverConnections />
      case 'my-profile':
        return <MyProfile />
      case 'connections':
        return <Connections />
      case 'groups':
        return <CommunityGroups />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-mist via-white to-purple-50">
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
      />
      <main className="pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Toaster />
    </div>
  )
}

export default App