'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import BookForm from './BookForm'
import RecommendationsPanel from './RecommendationsPanel'
import { getApiUrl } from '@/lib/api'
import { useNotifications } from '@/lib/useNotifications'

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

interface BookListResponse {
  books: Book[]
  total: number
  page: number
  limit: number
}

interface Recommendation {
  book: Book
  score: number
  reason: string
}

interface AISearchResponse {
  search_query: string
  recommendations: Recommendation[]
  total: number
  ai_powered: boolean
  message: string
}

export default function LibraryDashboard() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showBookForm, setShowBookForm] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [genres, setGenres] = useState<string[]>([])
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [aiSearchResults, setAiSearchResults] = useState<AISearchResponse | null>(null)
  const [showAiRecommendations, setShowAiRecommendations] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const { notifications } = useNotifications()

  const limit = 12

  useEffect(() => {
    fetchBooks()
    fetchGenres()
  }, [currentPage, selectedGenre, selectedStatus])

  const fetchGenres = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const response = await fetch(`${getApiUrl()}/books/genres/list`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setGenres(data.genres || [])
      }
    } catch (err) {
      console.error('Failed to fetch genres:', err)
    }
  }

  const fetchBooks = async () => {
    try {
      setLoading(true)
      setError('')

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session found')
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString()
      })

      if (selectedGenre !== 'all') {
        params.append('genre', selectedGenre)
      }

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }

      const response = await fetch(`${getApiUrl()}/books?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch books')
      }

      const data: BookListResponse = await response.json()
      setBooks(data.books)
      setTotalPages(Math.ceil(data.total / limit))

      // If no books found and there's a search term, fetch AI recommendations
      if (data.books.length === 0 && searchTerm.trim()) {
        await fetchAISearchRecommendations(searchTerm.trim())
      } else {
        setAiSearchResults(null)
        setShowAiRecommendations(false)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch books')
    } finally {
      setLoading(false)
    }
  }

  const fetchAISearchRecommendations = async (query: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const params = new URLSearchParams({
        search_query: query,
        limit: '5'
      })

      const response = await fetch(`${getApiUrl()}/books/recommendations/ai-search?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data: AISearchResponse = await response.json()
        setAiSearchResults(data)
        setShowAiRecommendations(true)
      }
    } catch (err) {
      console.error('Failed to fetch AI search recommendations:', err)
    }
  }

  const handleDelete = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book?')) {
      return
    }

    try {
      setDeleting(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session found')
      }

      const response = await fetch(`${getApiUrl()}/books/${bookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete book')
      }

      // Remove from selected books if it was selected
      setSelectedBooks(prev => {
        const newSet = new Set(prev)
        newSet.delete(bookId)
        return newSet
      })

      // Refresh the books list
      await fetchBooks()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete book')
    } finally {
      setDeleting(false)
    }
  }

  const handleCheckout = async (bookId: string, fromAIRecommendations: boolean = false) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session found')
      }

      const response = await fetch(`${getApiUrl()}/books/${bookId}/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ checkout_days: 14 })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to checkout book')
      }

      const result = await response.json()
      
      if (fromAIRecommendations) {
        // Update the AI recommendations to reflect the checkout
        if (aiSearchResults) {
          const updatedRecommendations = aiSearchResults.recommendations.map(rec => 
            rec.book.id === bookId 
              ? { ...rec, book: { ...rec.book, status: 'checked_out' } }
              : rec
          )
          setAiSearchResults({
            ...aiSearchResults,
            recommendations: updatedRecommendations
          })
        }
        
        // Show success message
        setError('')
        setSuccessMessage(`Successfully checked out "${result.book_title || 'book'}"!`)
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000)
        
      } else {
        // Refresh the books list for regular book grid
        await fetchBooks()
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to checkout book')
    }
  }

  const handleCheckin = async (bookId: string) => {
    try {
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
        throw new Error(errorData.detail || 'Failed to checkin book')
      }

      const result = await response.json()
      
      // Refresh the books list
      await fetchBooks()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to checkin book')
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchBooks()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      available: 'bg-green-100 text-green-800',
      checked_out: 'bg-yellow-100 text-yellow-800',
      reserved: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-red-100 text-red-800'
    }

    const statusLabels = {
      available: 'Available',
      checked_out: 'On Loan',
      reserved: 'Reserved',
      maintenance: 'Maintenance'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    )
  }

  const getConditionBadge = (condition: string) => {
    const conditionColors = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      fair: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800'
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${conditionColors[condition as keyof typeof conditionColors] || 'bg-gray-100 text-gray-800'}`}>
        {condition.charAt(0).toUpperCase() + condition.slice(1)}
      </span>
    )
  }

  if (showBookForm) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <BookForm
          book={editingBook || undefined}
          onSubmitComplete={(book) => {
            setShowBookForm(false)
            setEditingBook(null)
            fetchBooks()
          }}
          onCancel={() => {
            setShowBookForm(false)
            setEditingBook(null)
          }}
        />
      </div>
    )
  }

  if (showRecommendations) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="mb-4">
          <button
            onClick={() => setShowRecommendations(false)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Library
          </button>
        </div>
        <RecommendationsPanel />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📚 Library Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your book collection</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => setShowRecommendations(true)}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 w-full sm:w-auto"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                🤖 AI Insights
              </button>
              <button
                onClick={() => setShowBookForm(true)}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Book
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col space-y-4">
            {/* Search */}
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Search books by title, author, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Genre Filter */}
              <div className="sm:min-w-[140px]">
                <select
                  value={selectedGenre}
                  onChange={(e) => {
                    setSelectedGenre(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Genres</option>
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="sm:min-w-[140px]">
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="checked_out">On Loan</option>
                  <option value="reserved">Reserved</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
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

        {/* Checkout Notifications */}
        {notifications && notifications.has_notifications && (
          <div className="px-4 sm:px-6 py-4 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-amber-700 text-sm font-medium">
                  {notifications.overdue_count > 0 && notifications.due_soon_count > 0 
                    ? `You have ${notifications.overdue_count} overdue book${notifications.overdue_count !== 1 ? 's' : ''} and ${notifications.due_soon_count} book${notifications.due_soon_count !== 1 ? 's' : ''} due soon!`
                    : notifications.overdue_count > 0 
                    ? `You have ${notifications.overdue_count} overdue book${notifications.overdue_count !== 1 ? 's' : ''}!`
                    : `You have ${notifications.due_soon_count} book${notifications.due_soon_count !== 1 ? 's' : ''} due soon!`
                  }
                </p>
              </div>
              <button
                onClick={() => {
                  // Trigger navigation to checkouts view
                  if (typeof window !== 'undefined') {
                    const navButton = document.querySelector('[data-view="checkouts"]') as HTMLButtonElement
                    if (navButton) {
                      navButton.click()
                    }
                  }
                }}
                className="text-sm text-amber-600 hover:text-amber-800 font-medium underline"
              >
                Go to Check-In →
              </button>
            </div>
          </div>
        )}

        {/* Books Grid */}
        <div className="px-4 sm:px-6 py-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading books...</span>
            </div>
          ) : books.length === 0 ? (
            <div>
              {showAiRecommendations && aiSearchResults ? (
                <div className="space-y-6">
                  {/* No results message */}
                  <div className="text-center py-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No books found for "{aiSearchResults.search_query}"</h3>
                    <p className="mt-1 text-sm text-gray-500">But we found some books you might enjoy!</p>
                  </div>

                  {/* AI Recommendations */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200">
                    <div className="flex items-center space-x-2 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">🤖 AI Recommendations</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                        {aiSearchResults.ai_powered ? 'AI Powered' : 'Enhanced Search'}
                      </span>
                    </div>
                    <p className="text-sm text-blue-800 mb-4">{aiSearchResults.message}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {aiSearchResults.recommendations.map((rec) => (
                        <div key={rec.book.id} className="bg-white rounded-lg p-4 border shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex space-x-3">
                            {/* Book Cover */}
                            <div className="flex-shrink-0 w-12 h-16 bg-gray-100 rounded overflow-hidden">
                              {rec.book.cover_image_url ? (
                                <img
                                  src={rec.book.cover_image_url}
                                  alt={rec.book.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Book Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{rec.book.title}</h4>
                              <p className="text-xs text-gray-600">by {rec.book.author}</p>
                              <p className="text-xs text-gray-500 mt-1">{rec.book.genre}</p>
                              <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                                <p className="text-blue-700 font-medium">Why this matches:</p>
                                <p className="text-blue-600">{rec.reason}</p>
                              </div>
                              
                              {/* Action Button */}
                              <div className="mt-2">
                                {rec.book.status === 'available' ? (
                                  <button
                                    onClick={() => handleCheckout(rec.book.id, true)}
                                    className="w-full px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                  >
                                    Check Out
                                  </button>
                                ) : (
                                  <span className="w-full inline-block text-center px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                                    {rec.book.status === 'checked_out' ? 'On Loan' : 'Unavailable'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No books found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? `No results for "${searchTerm}". Try a different search term.` : 'Get started by adding your first book to the library.'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => (
                <div key={book.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  {/* Book Cover */}
                  <div className="aspect-[3/4] bg-gray-100 rounded-t-lg overflow-hidden">
                    <img
                      src={book.cover_image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAzMDAgNDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogICAgPHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNmM2Y0ZjYiLz4KICA8L3N2Zz4='}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        // Fallback to a simple placeholder
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAzMDAgNDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogICAgPHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNmM2Y0ZjYiLz4KICAgIDxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjI2MCIgaGVpZ2h0PSIzNjAiIGZpbGw9IiNlNWU3ZWIiIHN0cm9rZT0iIzljYTNhZiIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgICA8Y2lyY2xlIGN4PSIxNTAiIGN5PSIyMDAiIHI9IjQwIiBmaWxsPSIjOWNhM2FmIi8+CiAgICA8dGV4dCB4PSIxNTAiIHk9IjI1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNmI3MjgwIj5ObyBDb3ZlcjwvdGV4dD4KICA8L3N2Zz4='
                      }}
                    />
                  </div>

                  {/* Book Info */}
                  <div className="p-4">
                    <div className="mb-2">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2" title={book.title}>
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1" title={book.author}>
                        by {book.author}
                      </p>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Status:</span>
                        {getStatusBadge(book.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Condition:</span>
                        {getConditionBadge(book.condition)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Genre:</span>
                        <span className="text-xs text-gray-700">{book.genre}</span>
                      </div>
                      {book.location && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Location:</span>
                          <span className="text-xs text-gray-700">{book.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {book.status === 'available' ? (
                        <button
                          onClick={() => handleCheckout(book.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          Check Out
                        </button>
                      ) : book.status === 'checked_out' && book.checked_out_by ? (
                        <button
                          onClick={() => handleCheckin(book.id)}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          Check In
                        </button>
                      ) : (
                        <div className="w-full bg-gray-200 text-gray-500 text-xs font-medium py-2 px-3 rounded text-center">
                          {book.status === 'checked_out' ? 'On Loan' : 
                           book.status === 'reserved' ? 'Reserved' : 'Maintenance'}
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingBook(book)
                            setShowBookForm(true)
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 px-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(book.id)}
                          disabled={deleting || book.status === 'checked_out'}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-1.5 px-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
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
