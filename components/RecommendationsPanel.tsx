'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getApiUrl } from '@/lib/api'

interface Book {
  id: string
  title: string
  author: string
  genre: string
  cover_image_url?: string
  status: string
}

interface Recommendation {
  book: Book
  score: number
  reason: string
}



interface RecommendationsPanelProps {
  onBookSelect?: (book: Book) => void
}

export default function RecommendationsPanel({ onBookSelect }: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [aiRecommendations, setAiRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'recommendations' | 'ai-recommendations'>('recommendations')
  const [aiEnabled, setAiEnabled] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session found')
      }

      // Fetch all data in parallel
      const [recommendationsRes, aiRecommendationsRes] = await Promise.all([
        fetch(`${getApiUrl()}/books/recommendations/personalized`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch(`${getApiUrl()}/books/recommendations/ai-enhanced`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
      ])

      if (recommendationsRes.ok) {
        const recData = await recommendationsRes.json()
        setRecommendations(recData.recommendations || [])
      }

      if (aiRecommendationsRes.ok) {
        const aiRecData = await aiRecommendationsRes.json()
        setAiRecommendations(aiRecData.recommendations || [])
        setAiEnabled(aiRecData.ai_powered || false)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async (bookId: string) => {
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

      // Refresh recommendations after checkout
      await fetchData()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to checkout book')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading recommendations...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'recommendations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📚 Recommendations
          </button>
          {aiEnabled && (
            <button
              onClick={() => setActiveTab('ai-recommendations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'ai-recommendations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🤖 AI Enhanced
            </button>
          )}

        </nav>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Recommended for You</h3>
            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📚</div>
                <p className="text-gray-500">Check out some books to get personalized recommendations!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={rec.book.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex space-x-4">
                      {/* Book Cover */}
                      <div className="flex-shrink-0 w-16 h-20 bg-gray-100 rounded overflow-hidden">
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
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Book Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{rec.book.title}</h4>
                        <p className="text-sm text-gray-600">by {rec.book.author}</p>
                        <p className="text-xs text-gray-500 mt-1">{rec.book.genre}</p>
                        <p className="text-xs text-blue-600 mt-2 italic">{rec.reason}</p>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        {rec.book.status === 'available' ? (
                          <button
                            onClick={() => handleCheckout(rec.book.id)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            Check Out
                          </button>
                        ) : (
                          <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                            {rec.book.status === 'checked_out' ? 'Checked Out' : 'Unavailable'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Enhanced Recommendations Tab */}
        {activeTab === 'ai-recommendations' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">AI-Enhanced Recommendations</h3>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                {aiEnabled ? '🤖 AI Powered' : '⚠️ AI Unavailable'}
              </span>
            </div>
            {aiRecommendations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">🤖</div>
                <p className="text-gray-500">
                  {aiEnabled ? 
                    'AI is analyzing your reading patterns to provide enhanced recommendations...' : 
                    'AI recommendations are currently unavailable. Using fallback recommendations.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    🧠 These recommendations are powered by AI analysis of your reading history, 
                    considering your preferences, themes you enjoy, and books that readers with similar tastes have loved.
                  </p>
                </div>
                {aiRecommendations.map((rec, index) => (
                  <div key={rec.book.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex space-x-4">
                      {/* Book Cover */}
                      <div className="flex-shrink-0 w-16 h-20 bg-gray-100 rounded overflow-hidden shadow-sm">
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
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Book Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{rec.book.title}</h4>
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-medium">
                            AI Match: {Math.round((rec.score || 0.8) * 100)}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">by {rec.book.author}</p>
                        <p className="text-xs text-gray-500 mt-1">{rec.book.genre}</p>
                        <div className="mt-2 p-2 bg-white/60 rounded border">
                          <p className="text-xs text-purple-700 font-medium">🤖 AI Insight:</p>
                          <p className="text-xs text-purple-600 mt-1">{rec.reason}</p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        {rec.book.status === 'available' ? (
                          <button
                            onClick={() => handleCheckout(rec.book.id)}
                            className="px-3 py-1 bg-gradient-to-r from-green-600 to-blue-600 text-white text-xs rounded hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                          >
                            Check Out
                          </button>
                        ) : (
                          <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                            {rec.book.status === 'checked_out' ? 'Checked Out' : 'Unavailable'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && insights && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Your Reading Journey</h3>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{insights.total_books_read}</div>
                <div className="text-sm text-blue-800">Books Read</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{insights.reading_streak}</div>
                <div className="text-sm text-green-800">Day Streak</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{insights.genre_diversity}</div>
                <div className="text-sm text-purple-800">Genres</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {insights.reading_pattern.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </div>
                <div className="text-sm text-orange-800">Reading Style</div>
              </div>
            </div>

            {/* Favorites */}
            {(insights.favorite_genre || insights.favorite_author) && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Your Favorites</h4>
                {insights.favorite_genre && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Favorite Genre:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">{insights.favorite_genre}</span>
                  </div>
                )}
                {insights.favorite_author && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Favorite Author:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">{insights.favorite_author}</span>
                  </div>
                )}
              </div>
            )}

            {/* AI Insights */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">AI Insights</h4>
              <div className="space-y-2">
                {insights.insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="text-blue-500 mt-1">✨</div>
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Library Analytics</h3>
            
            {/* Library Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analytics.total_books}</div>
                <div className="text-sm text-blue-800">Total Books</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analytics.available_books}</div>
                <div className="text-sm text-green-800">Available</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{analytics.checked_out_books}</div>
                <div className="text-sm text-orange-800">Checked Out</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{analytics.library_utilization}%</div>
                <div className="text-sm text-purple-800">Utilization</div>
              </div>
            </div>

            {/* Popular Genres */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Popular Genres</h4>
              <div className="space-y-2">
                {analytics.popular_genres.map((item, index) => (
                  <div key={item.genre} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.genre}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${(item.count / (analytics.popular_genres[0]?.count || 1)) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-blue-600">{analytics.recent_checkouts}</span> books checked out in the last 30 days
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
