'use client'

import { User } from '@supabase/supabase-js'
import { useState } from 'react'
import Navbar from './Navbar'
import LibraryDashboard from './LibraryDashboard'
import ReadmePage from './ReadmePage'
import UserCheckouts from './UserCheckouts'

interface HomePageProps {
  user: User
  onSignOut: () => void
}

export default function HomePage({ user, onSignOut }: HomePageProps) {
  const [currentView, setCurrentView] = useState<'library' | 'checkouts' | 'readme'>('library')

  const handleViewChange = (view: string) => {
    setCurrentView(view as 'library' | 'checkouts' | 'readme')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        user={user}
        onSignOut={onSignOut}
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      {/* Main Content */}
      {currentView === 'library' ? (
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <LibraryDashboard />
          </div>
        </main>
      ) : currentView === 'checkouts' ? (
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <UserCheckouts />
          </div>
        </main>
      ) : (
        <ReadmePage user={user} onSignOut={onSignOut} />
      )}
    </div>
  )
}
