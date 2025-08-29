'use client'

import { User } from '@supabase/supabase-js'
import Navbar from './Navbar'
import DocumentDashboard from './DocumentDashboard'

interface HomePageProps {
  user: User
  onSignOut: () => void
}

export default function HomePage({ user, onSignOut }: HomePageProps) {

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onSignOut={onSignOut} />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <DocumentDashboard />
        </div>
      </main>
    </div>
  )
}
