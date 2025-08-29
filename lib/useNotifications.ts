import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getApiUrl } from '@/lib/api'

interface NotificationData {
  total_checkouts: number
  overdue_count: number
  due_soon_count: number
  overdue_books: Array<{
    id: string
    title: string
    author: string
    due_date: string
    days_overdue: number
  }>
  due_soon_books: Array<{
    id: string
    title: string
    author: string
    due_date: string
    days_until_due: number
  }>
  has_notifications: boolean
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError('')

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setNotifications(null)
        return
      }

      const response = await fetch(`${getApiUrl()}/books/my-checkouts/notifications`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      setNotifications(data)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
      setNotifications(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    
    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    notifications,
    loading,
    error,
    refresh: fetchNotifications
  }
}
