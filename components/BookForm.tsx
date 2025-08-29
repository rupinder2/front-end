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

interface BookFormProps {
  book?: Book
  onSubmitComplete?: (book: Book) => void
  onCancel?: () => void
}

// Default genres fallback (will be replaced by dynamic fetch)
const DEFAULT_GENRES = [
  'Fiction', 'Non-fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Thriller',
  'Romance', 'Horror', 'Biography', 'History', 'Science', 'Philosophy',
  'Psychology', 'Self-help', 'Business', 'Technology', 'Art', 'Poetry',
  'Drama', 'Adventure', 'Classic Literature', 'Young Adult', 'Children',
  'Comics', 'Graphic Novel', 'Reference', 'Textbook', 'Cookbook', 'Travel',
  'Religion', 'Politics', 'Health', 'Sports', 'Humor', 'Crime', 'Western',
  'Dystopian Fiction', 'Coming-of-age', 'Memoir', 'Essay', 'Short Stories',
  'Anthology', 'Dictionary', 'Encyclopedia', 'Manual', 'Guide'
]

const CONDITIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' }
]

export default function BookForm({ book, onSubmitComplete, onCancel }: BookFormProps) {
  const [formData, setFormData] = useState({
    title: book?.title || '',
    author: book?.author || '',
    isbn: book?.isbn || '',
    genre: book?.genre || '',
    publication_year: book?.publication_year || '',
    description: book?.description || '',
    publisher: book?.publisher || '',
    pages: book?.pages || '',
    language: book?.language || 'English',
    location: book?.location || '',
    condition: book?.condition || 'good',
    cover_image_url: book?.cover_image_url || ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('file')
  const [genres, setGenres] = useState<string[]>(DEFAULT_GENRES)

  useEffect(() => {
    fetchGenres()
  }, [])

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
        if (data.genres && data.genres.length > 0) {
          setGenres(data.genres)
        }
      }
    } catch (err) {
      console.error('Failed to fetch genres:', err)
      // Keep default genres on error
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
        return
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size too large. Maximum 5MB allowed.')
        return
      }

      setSelectedImage(file)
      setError('')

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview('')
    const fileInput = document.getElementById('cover_image') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session found')
      }

      let response: Response

      if (book) {
        // For updates, use the existing JSON endpoint
        const bookData = {
          ...formData,
          publication_year: formData.publication_year ? parseInt(formData.publication_year.toString()) : null,
          pages: formData.pages ? parseInt(formData.pages.toString()) : null
        }

        // Remove empty strings and replace with null
        Object.keys(bookData).forEach(key => {
          if (bookData[key as keyof typeof bookData] === '') {
            (bookData as any)[key] = null
          }
        })

        response = await fetch(`${getApiUrl()}/books/${book.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bookData)
        })
      } else {
        // For new books, use FormData if there's an image, otherwise use JSON
        if (selectedImage) {
          // Use form data for image upload
          const formDataToSend = new FormData()
          formDataToSend.append('title', formData.title)
          formDataToSend.append('author', formData.author)
          formDataToSend.append('genre', formData.genre)
          
          if (formData.isbn) formDataToSend.append('isbn', formData.isbn)
          if (formData.publication_year) formDataToSend.append('publication_year', formData.publication_year.toString())
          if (formData.description) formDataToSend.append('description', formData.description)
          if (formData.publisher) formDataToSend.append('publisher', formData.publisher)
          if (formData.pages) formDataToSend.append('pages', formData.pages.toString())
          if (formData.language) formDataToSend.append('language', formData.language)
          if (formData.location) formDataToSend.append('location', formData.location)
          formDataToSend.append('condition', formData.condition)
          
          formDataToSend.append('cover_image', selectedImage)

          response = await fetch(`${getApiUrl()}/books/with-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            },
            body: formDataToSend
          })
        } else {
          // Use JSON for regular submission (with URL or no image)
          const bookData = {
            ...formData,
            publication_year: formData.publication_year ? parseInt(formData.publication_year.toString()) : null,
            pages: formData.pages ? parseInt(formData.pages.toString()) : null
          }

          // Remove empty strings and replace with null
          Object.keys(bookData).forEach(key => {
            if (bookData[key as keyof typeof bookData] === '') {
              (bookData as any)[key] = null
            }
          })

          response = await fetch(`${getApiUrl()}/books`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookData)
          })
        }
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Failed to ${book ? 'update' : 'create'} book`)
      }

      const savedBook = await response.json() as Book
      
      if (onSubmitComplete) {
        onSubmitComplete(savedBook)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${book ? 'update' : 'create'} book`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {book ? 'Edit Book' : 'Add New Book'}
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Required Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter book title"
            />
          </div>

          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
              Author *
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter author name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
              Genre *
            </label>
            <select
              id="genre"
              name="genre"
              value={formData.genre}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a genre</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-2">
              ISBN
            </label>
            <input
              type="text"
              id="isbn"
              name="isbn"
              value={formData.isbn}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ISBN (optional)"
            />
          </div>
        </div>

        {/* Optional Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="publication_year" className="block text-sm font-medium text-gray-700 mb-2">
              Publication Year
            </label>
            <input
              type="number"
              id="publication_year"
              name="publication_year"
              value={formData.publication_year}
              onChange={handleInputChange}
              min="1000"
              max="2100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="YYYY"
            />
          </div>

          <div>
            <label htmlFor="pages" className="block text-sm font-medium text-gray-700 mb-2">
              Pages
            </label>
            <input
              type="number"
              id="pages"
              name="pages"
              value={formData.pages}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Number of pages"
            />
          </div>

          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {CONDITIONS.map(condition => (
                <option key={condition.value} value={condition.value}>
                  {condition.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="publisher" className="block text-sm font-medium text-gray-700 mb-2">
              Publisher
            </label>
            <input
              type="text"
              id="publisher"
              name="publisher"
              value={formData.publisher}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Publisher name"
            />
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <input
              type="text"
              id="language"
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Language"
            />
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location (Shelf)
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., A-1-001"
          />
        </div>

        {/* Cover Image Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image
          </label>
          
          {/* Upload Method Toggle */}
          <div className="flex space-x-4 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="uploadMethod"
                value="file"
                checked={uploadMethod === 'file'}
                onChange={(e) => setUploadMethod(e.target.value as 'url' | 'file')}
                className="mr-2"
              />
              Upload File
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="uploadMethod"
                value="url"
                checked={uploadMethod === 'url'}
                onChange={(e) => setUploadMethod(e.target.value as 'url' | 'file')}
                className="mr-2"
              />
              Use URL
            </label>
          </div>

          {uploadMethod === 'file' ? (
            <div>
              <input
                type="file"
                id="cover_image"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepts JPEG, PNG, GIF, WebP. Max 5MB.
              </p>
              
              {/* Image Preview */}
              {(imagePreview || (book?.cover_image_url && !selectedImage)) && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <div className="relative inline-block">
                    <img
                      src={imagePreview || book?.cover_image_url}
                      alt="Cover preview"
                      className="w-32 h-40 object-cover border border-gray-300 rounded-md"
                    />
                    {selectedImage && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <input
                type="url"
                id="cover_image_url"
                name="cover_image_url"
                value={formData.cover_image_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/cover.jpg"
              />
              
              {/* URL Preview */}
              {formData.cover_image_url && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <img
                    src={formData.cover_image_url}
                    alt="Cover preview"
                    className="w-32 h-40 object-cover border border-gray-300 rounded-md"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Book description or summary"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {book ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={book ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                </svg>
                {book ? 'Update Book' : 'Add Book'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
