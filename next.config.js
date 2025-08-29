/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Only proxy in development - in production we'll use NEXT_PUBLIC_API_URL
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*', // Proxy to Backend
        },
      ]
    }
    return []
  },
}

module.exports = nextConfig