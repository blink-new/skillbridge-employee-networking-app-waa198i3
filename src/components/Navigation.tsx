import { motion } from 'framer-motion'
import { Home, Search, User, Users, Building2, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { blink } from '../blink/client'
import { useState, useEffect } from 'react'

type Page = 'dashboard' | 'profile-setup' | 'discover' | 'my-profile' | 'connections' | 'groups'

interface NavigationProps {
  currentPage: Page
  onPageChange: (page: Page) => void
}

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = await blink.auth.me()
        if (currentUser) {
          setUser(currentUser)
          
          // Load user profile
          const profiles = await blink.db.userProfiles.list({
            where: { user_id: currentUser.id },
            limit: 1
          })
          
          if (profiles.length > 0) {
            setUserProfile(profiles[0])
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    loadUserData()
  }, [])
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'discover', label: 'Discover', icon: Search },
    { id: 'connections', label: 'Connections', icon: Users },
    { id: 'groups', label: 'Groups', icon: Building2 },
  ]

  const handleLogout = () => {
    blink.auth.logout()
  }

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 glass-card border-0 border-b border-white/20 backdrop-blur-xl bg-white/10 z-50"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-electric-indigo">SkillBridge</h1>
            </div>
          </motion.div>

          {/* Navigation Items */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => onPageChange(item.id as Page)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-2 transition-all duration-300 ${
                      isActive
                        ? 'glass-badge text-electric-indigo bg-electric-indigo/10'
                        : 'text-slate-navy/70 hover:text-slate-navy hover:bg-white/20'
                    }`}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* User Menu */}
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full glass-button">
                    <Avatar className="h-10 w-10 ring-2 ring-electric-indigo/20">
                      <AvatarImage src={user?.avatar} alt={user?.email} />
                      <AvatarFallback className="bg-electric-indigo text-white">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 glass-modal border-white/30" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none text-slate-navy">{userProfile?.name || 'User'}</p>
                  <p className="text-xs leading-none text-slate-navy/60">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-white/20" />
                <DropdownMenuItem 
                  onClick={() => onPageChange('my-profile')}
                  className="text-slate-navy hover:bg-white/20 cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/20" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-slate-navy hover:bg-white/20 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <motion.div 
        className="md:hidden"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-white/20">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <motion.button
                key={item.id}
                onClick={() => onPageChange(item.id as Page)}
                className={`w-full text-left px-3 py-2 rounded-xl text-base font-medium flex items-center space-x-2 transition-all duration-300 ${
                  isActive
                    ? 'glass-badge text-electric-indigo bg-electric-indigo/10'
                    : 'text-slate-navy/70 hover:text-slate-navy hover:bg-white/20'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </motion.nav>
  )
}