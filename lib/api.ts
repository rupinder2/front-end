/**
 * API Configuration and Utilities
 */

// Get the API base URL based on environment
export function getApiUrl(): string {
  // In production, use the deployed backend URL
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://backend-theta-dusky-43.vercel.app'
  }
  
  // In development, use the configured URL or fallback to proxy
  return process.env.NEXT_PUBLIC_API_URL || '/api'
}

// API fetch helper with proper URL handling
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const baseUrl = getApiUrl()
  const url = `${baseUrl}${endpoint}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }
  
  const response = await fetch(url, defaultOptions)
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }
  
  return response
}

// Health check function
export async function checkApiHealth() {
  try {
    const response = await apiRequest('/health')
    return await response.json()
  } catch (error) {
    console.error('API health check failed:', error)
    throw error
  }
}
