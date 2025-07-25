import { Loader2 } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-mist via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        </div>
        <h2 className="text-lg font-medium text-slate-navy mb-2">Loading SkillBridge</h2>
        <p className="text-sm text-muted-foreground">Connecting you to your network...</p>
      </div>
    </div>
  )
}