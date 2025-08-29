'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getApiUrl } from '@/lib/api'

interface Book {
  id: string
  title: string
  author: string
  isbn?: string
  genre: string
  publication_year?: number
  description?: string
  publisher?: string
  pages?: number
  language: string
  location?: string
  condition: string
  cover_image_url?: string
  status: string
  added_by: string
  checked_out_by?: string
  checked_out_at?: string
  due_date?: string
  created_at: string
  updated_at: string
}

interface CheckoutInfo extends Book {
  is_overdue: boolean
  days_overdue: number
  days_until_due: number
}

export default function UserCheckouts() {
  const [checkouts, setCheckouts] = useState<CheckoutInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkinLoading, setCheckinLoading] = useState<Set<string>>(new Set())
  const [extendLoading, setExtendLoading] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [successMessage, setSuccessMessage] = useState('')

  const limit = 10

  useEffect(() => {
    fetchCheckouts()
  }, [currentPage])

  const fetchCheckouts = async () => {
    try {
      setLoading(true)
      setError('')

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session found')
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString()
      })

      const response = await fetch(`${getApiUrl()}/books/my-checkouts?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch checkouts')
      }

      const data = await response.json()
      
      // Process the books to add overdue information
      const currentDate = new Date()
      const processedCheckouts = data.books.map((book: Book) => {
        const dueDate = book.due_date ? new Date(book.due_date) : null
        const isOverdue = dueDate ? currentDate > dueDate : false
        const daysDiff = dueDate ? Math.ceil((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
        
        return {
          ...book,
          is_overdue: isOverdue,
          days_overdue: isOverdue ? Math.abs(daysDiff) : 0,
          days_until_due: !isOverdue ? daysDiff : 0
        }
      })

      setCheckouts(processedCheckouts)
      setTotalPages(Math.ceil(data.total / limit))

    } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to fetch loans')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckin = async (bookId: string, bookTitle: string) => {
    try {
      setCheckinLoading(prev => new Set(prev).add(bookId))
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session found')
      }

      const response = await fetch(`${getApiUrl()}/books/${bookId}/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to check in book')
      }

      const result = await response.json()
      
      // Show success message
      setSuccessMessage(`Successfully checked in "${bookTitle}"${result.was_overdue ? ` (was ${result.days_overdue} days overdue)` : ''}`)
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000)
      
      // Refresh the checkouts list
      await fetchCheckouts()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check in book')
    } finally {
      setCheckinLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(bookId)
        return newSet
      })
    }
  }

  const handleExtendCheckout = async (bookId: string, bookTitle: string, extendDays: number = 7) => {
    try {
      setExtendLoading(prev => new Set(prev).add(bookId))
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session found')
      }

      const response = await fetch(`${getApiUrl()}/books/${bookId}/extend-checkout?extend_days=${extendDays}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to renew loan')
      }

      const result = await response.json()
      
      // Show success message
      setSuccessMessage(`Renewed "${bookTitle}" for ${extendDays} additional days. ${result.message}`)
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000)
      
      // Refresh the checkouts list
      await fetchCheckouts()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to renew loan')
    } finally {
      setExtendLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(bookId)
        return newSet
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (checkout: CheckoutInfo) => {
    if (checkout.is_overdue) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {checkout.days_overdue} day{checkout.days_overdue !== 1 ? 's' : ''} overdue
        </span>
      )
    } else if (checkout.days_until_due <= 3) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Due in {checkout.days_until_due} day{checkout.days_until_due !== 1 ? 's' : ''}
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Due in {checkout.days_until_due} day{checkout.days_until_due !== 1 ? 's' : ''}
        </span>
      )
    }
  }

  const overdueCount = checkouts.filter(c => c.is_overdue).length
  const dueSoonCount = checkouts.filter(c => !c.is_overdue && c.days_until_due <= 3).length

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📖 My Checked Out Books</h1>
              <p className="text-sm text-gray-600 mt-1">
                View and manage your current book loans
              </p>
            </div>
            
            {/* Summary Stats */}
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {checkouts.length} book{checkouts.length !== 1 ? 's' : ''} on loan
              </div>
              {overdueCount > 0 && (
                <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  {overdueCount} overdue
                </div>
              )}
              {dueSoonCount > 0 && (
                <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  {dueSoonCount} due soon
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 sm:px-6 py-4 bg-red-50 border-b border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="px-4 sm:px-6 py-4 bg-green-50 border-b border-green-200">
            <p className="text-green-600 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Content */}
        <div className="px-4 sm:px-6 py-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading your loans...</span>
            </div>
          ) : checkouts.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No books on loan</h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't currently have any books on loan. Visit the library to borrow some books!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {checkouts.map((checkout) => (
                <div 
                  key={checkout.id} 
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    checkout.is_overdue ? 'border-red-200 bg-red-50' : 
                    checkout.days_until_due <= 3 ? 'border-yellow-200 bg-yellow-50' : 
                    'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    {/* Book Info */}
                    <div className="flex space-x-4 flex-1">
                      {/* Book Cover */}
                      <div className="flex-shrink-0 w-16 h-20 bg-gray-100 rounded overflow-hidden">
                        {checkout.cover_image_url ? (
                          <img
                            src={checkout.cover_image_url}
                            alt={checkout.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAzMDAgNDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogICAgPHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNmM2Y0ZjYiLz4KICA8L3N2Zz4='
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Book Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate" title={checkout.title}>
                          {checkout.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">by {checkout.author}</p>
                        <p className="text-sm text-gray-500">{checkout.genre}</p>
                        
                        {checkout.location && (
                          <p className="text-xs text-gray-500 mt-1">
                            📍 Location: {checkout.location}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap gap-2 text-sm">
                          <span className="text-gray-600">
                            Borrowed: {checkout.checked_out_at ? formatDate(checkout.checked_out_at) : 'Unknown'}
                          </span>
                          <span className="text-gray-600">
                            Due: {checkout.due_date ? formatDate(checkout.due_date) : 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-4">
                      {/* Status Badge */}
                      <div className="flex justify-center lg:justify-end">
                        {getStatusBadge(checkout)}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2 lg:space-y-0 lg:space-x-2 lg:flex-row">
                        {/* Extend Button */}
                        {!checkout.is_overdue && (
                          <button
                            onClick={() => handleExtendCheckout(checkout.id, checkout.title, 7)}
                            disabled={extendLoading.has(checkout.id)}
                            className="inline-flex items-center justify-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {extendLoading.has(checkout.id) ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Renewing...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Renew (+7 days)
                              </>
                            )}
                          </button>
                        )}

                        {/* Check-in Button */}
                        <button
                          onClick={() => handleCheckin(checkout.id, checkout.title)}
                          disabled={checkinLoading.has(checkout.id)}
                          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {checkinLoading.has(checkout.id) ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Checking In...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Check In
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="text-sm text-gray-700 text-center sm:text-left">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2 justify-center sm:justify-end">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
