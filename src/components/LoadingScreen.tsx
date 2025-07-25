import { Loader2 } from 'lucide-react'

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Loading SkillBridge</h2>
        <p className="text-sm text-gray-600">Connecting you to your network...</p>
      </div>
    </div>
  )
}

export default LoadingScreen