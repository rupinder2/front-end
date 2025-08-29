'use client'

import { User } from '@supabase/supabase-js'
import { useState } from 'react'
import Navbar from './Navbar'
import DocumentDashboard from './DocumentDashboard'
import ReadmePage from './ReadmePage'

interface HomePageProps {
  user: User
  onSignOut: () => void
}

export default function HomePage({ user, onSignOut }: HomePageProps) {
  const [currentView, setCurrentView] = useState<'documents' | 'readme'>('documents')

  const handleViewChange = (view: string) => {
    setCurrentView(view as 'documents' | 'readme')
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
      {currentView === 'documents' ? (
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <DocumentDashboard />
          </div>
        </main>
      ) : (
        <ReadmePage user={user} onSignOut={onSignOut} />
      )}
    </div>
  )
}
