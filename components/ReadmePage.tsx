'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'

interface ReadmePageProps {
  user: User
  onSignOut: () => void
}

interface ExpandableSectionProps {
  title: string
  children: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
}

function ExpandableSection({ title, children, isExpanded, onToggle }: ExpandableSectionProps) {
  return (
    <div className="border border-gray-200 rounded-lg mb-4">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-lg"
      >
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="px-6 pb-4 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  )
}

export default function ReadmePage({ user, onSignOut }: ReadmePageProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                📚 Documentation
              </h1>
              <p className="mt-2 text-gray-600">
                Learn about the architecture and implementation of this library management system
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Welcome back,</p>
              <p className="text-sm font-medium text-gray-900">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 mb-8">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Library Management System</h2>
              <p className="text-gray-600">A full-stack application for library book management, recommendations, and user checkouts</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-600 font-semibold">Frontend</div>
              <div className="text-sm text-gray-600">Next.js + React</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-600 font-semibold">Backend</div>
              <div className="text-sm text-gray-600">FastAPI + Python</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-purple-600 font-semibold">Database</div>
              <div className="text-sm text-gray-600">Supabase (PostgreSQL)</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-orange-600 font-semibold">Storage</div>
              <div className="text-sm text-gray-600">Supabase Storage</div>
            </div>
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-6">
          {/* Frontend Architecture */}
          <ExpandableSection
            title="🎨 Frontend Architecture"
            isExpanded={expandedSections.has('frontend')}
            onToggle={() => toggleSection('frontend')}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Technology Stack</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium text-gray-900">Framework</div>
                    <div className="text-sm text-gray-600">Next.js 14.0.4</div>
                    <div className="text-xs text-gray-500 mt-1">React-based full-stack framework</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium text-gray-900">Runtime</div>
                    <div className="text-sm text-gray-600">React 18</div>
                    <div className="text-xs text-gray-500 mt-1">Latest React with concurrent features</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium text-gray-900">Styling</div>
                    <div className="text-sm text-gray-600">Tailwind CSS 3.3.6</div>
                    <div className="text-xs text-gray-500 mt-1">Utility-first CSS framework</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium text-gray-900">Authentication</div>
                    <div className="text-sm text-gray-600">Supabase Auth</div>
                    <div className="text-xs text-gray-500 mt-1">JWT-based authentication</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Features</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>Mobile-First Design:</strong> Responsive layout that works perfectly on all devices</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>Real-time Authentication:</strong> Secure JWT token management with Supabase</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>Book Management:</strong> Add, edit, view, and manage library books with cover images</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>AI-Powered Recommendations:</strong> Smart book recommendations based on reading history</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>Check-in/Check-out System:</strong> Track book lending with due dates and notifications</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>Search & Filtering:</strong> Find books quickly with search and genre filters</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Component Architecture</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-800 overflow-x-auto">
{`📁 components/
├── AuthForm.tsx           # Authentication form
├── BookForm.tsx          # Add/edit book form
├── LibraryDashboard.tsx  # Main library management
├── RecommendationsPanel.tsx # AI recommendations
├── UserCheckouts.tsx     # User checkout management
├── HomePage.tsx          # Main layout wrapper
├── Navbar.tsx            # Navigation header
└── ReadmePage.tsx        # This documentation`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">State Management</h3>
                <p className="text-gray-700 mb-3">
                  The application uses React hooks for state management:
                </p>
                <ul className="space-y-1 text-sm text-gray-600 ml-4">
                  <li>• <code className="bg-gray-100 px-1 rounded">useState</code> for local component state</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">useEffect</code> for side effects and data fetching</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">useContext</code> could be added for global state if needed</li>
                </ul>
              </div>
            </div>
          </ExpandableSection>

          {/* Backend Architecture */}
          <ExpandableSection
            title="⚙️ Backend Architecture"
            isExpanded={expandedSections.has('backend')}
            onToggle={() => toggleSection('backend')}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Technology Stack</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium text-gray-900">Framework</div>
                    <div className="text-sm text-gray-600">FastAPI</div>
                    <div className="text-xs text-gray-500 mt-1">Modern Python web framework</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium text-gray-900">ASGI Server</div>
                    <div className="text-sm text-gray-600">Uvicorn</div>
                    <div className="text-xs text-gray-500 mt-1">Lightning-fast ASGI server</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium text-gray-900">Database</div>
                    <div className="text-sm text-gray-600">Supabase (PostgreSQL)</div>
                    <div className="text-xs text-gray-500 mt-1">Cloud-hosted PostgreSQL</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium text-gray-900">Authentication</div>
                    <div className="text-sm text-gray-600">Supabase Auth</div>
                    <div className="text-xs text-gray-500 mt-1">JWT token validation</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">API Endpoints</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-gray-900">Authentication</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <code className="bg-white px-2 py-1 rounded">GET /api/auth/validate-token</code> - Validate JWT token<br/>
                        <code className="bg-white px-2 py-1 rounded">GET /api/auth/me</code> - Get current user<br/>
                        <code className="bg-white px-2 py-1 rounded">GET /api/auth/profile</code> - Get user profile<br/>
                        <code className="bg-white px-2 py-1 rounded">POST /api/auth/logout</code> - Logout user
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 mt-3">Books</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <code className="bg-white px-2 py-1 rounded">POST /api/books</code> - Add new book<br/>
                        <code className="bg-white px-2 py-1 rounded">GET /api/books</code> - List books<br/>
                        <code className="bg-white px-2 py-1 rounded">GET /api/books/{'{'}id{'}'}</code> - Get book details<br/>
                        <code className="bg-white px-2 py-1 rounded">PUT /api/books/{'{'}id{'}'}</code> - Update book<br/>
                        <code className="bg-white px-2 py-1 rounded">DELETE /api/books/{'{'}id{'}'}</code> - Delete book<br/>
                        <code className="bg-white px-2 py-1 rounded">POST /api/books/{'{'}id{'}'}/checkout</code> - Checkout book<br/>
                        <code className="bg-white px-2 py-1 rounded">POST /api/books/{'{'}id{'}'}/checkin</code> - Return book<br/>
                        <code className="bg-white px-2 py-1 rounded">GET /api/books/recommendations</code> - Get AI recommendations
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Structure</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-800 overflow-x-auto">
{`📁 backend/
├── main.py              # FastAPI application entry point
├── config.py            # Configuration management
├── supabase_client.py   # Supabase client setup
├── models/              # Pydantic data models
│   ├── user.py
│   └── book.py
├── routers/             # API route handlers
│   ├── auth.py          # Authentication endpoints
│   └── books.py         # Book management endpoints
├── auth/                # Authentication logic
│   ├── dependencies.py  # JWT validation
│   └── jwt_handler.py   # JWT token handling
└── services/            # Business logic services
    └── ai_service.py    # AI recommendation service`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Security Features</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>JWT Authentication:</strong> Secure token-based authentication with Supabase</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>CORS Protection:</strong> Configured CORS middleware for cross-origin requests</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>User Isolation:</strong> All operations are scoped to authenticated users</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>File Validation:</strong> MIME type detection and file size limits</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>Error Handling:</strong> Comprehensive error handling with proper HTTP status codes</span>
                  </li>
                </ul>
              </div>
            </div>
          </ExpandableSection>

          {/* Database Schema */}
          <ExpandableSection
            title="🗄️ Database & Storage"
            isExpanded={expandedSections.has('database')}
            onToggle={() => toggleSection('database')}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Supabase Database Schema</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">books Table</h4>
                  <pre className="text-sm text-gray-800 overflow-x-auto">
{`CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR NOT NULL,
  author VARCHAR NOT NULL,
  isbn VARCHAR,
  genre VARCHAR NOT NULL,
  publication_year INTEGER,
  description TEXT,
  cover_image_url VARCHAR,
  status VARCHAR DEFAULT 'available',
  condition VARCHAR DEFAULT 'good',
  added_by UUID NOT NULL,
  checked_out_by UUID,
  checked_out_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Storage Architecture</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="font-medium text-blue-900">Supabase Storage</div>
                    <div className="text-sm text-blue-700 mt-1">
                      • Book cover image storage<br/>
                      • Automatic CDN delivery<br/>
                      • Public URLs for covers<br/>
                      • Optimized image serving
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="font-medium text-green-900">Book Organization</div>
                    <div className="text-sm text-green-700 mt-1">
                      • Books categorized by genre<br/>
                      • Unique book identifiers<br/>
                      • Rich metadata support<br/>
                      • AI-powered recommendations
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Book Management Pipeline</h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <span className="text-blue-600 font-bold">1</span>
                      </div>
                      <div className="text-sm text-gray-600 text-center">Book Entry</div>
                    </div>
                    <svg className="w-6 h-6 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <span className="text-blue-600 font-bold">2</span>
                      </div>
                      <div className="text-sm text-gray-600 text-center">Validation</div>
                    </div>
                    <svg className="w-6 h-6 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <span className="text-blue-600 font-bold">3</span>
                      </div>
                      <div className="text-sm text-gray-600 text-center">Database</div>
                    </div>
                    <svg className="w-6 h-6 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <span className="text-green-600 font-bold">4</span>
                      </div>
                      <div className="text-sm text-gray-600 text-center">AI Analysis</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ExpandableSection>

          {/* Deployment & DevOps */}
          <ExpandableSection
            title="🚀 Deployment & Development"
            isExpanded={expandedSections.has('deployment')}
            onToggle={() => toggleSection('deployment')}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Environment Setup</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Frontend Dependencies</h4>
                  <pre className="text-sm text-gray-800 overflow-x-auto mb-4">
{`npm install
# or
yarn install`}
                  </pre>

                  <h4 className="font-medium text-gray-900 mb-2">Backend Dependencies</h4>
                  <pre className="text-sm text-gray-800 overflow-x-auto mb-4">
{`pip install -r requirements.txt`}
                  </pre>

                  <h4 className="font-medium text-gray-900 mb-2">Environment Variables</h4>
                  <pre className="text-sm text-gray-800 overflow-x-auto">
{`# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend (.env)
SUPABASE_URL=your_supabase_url
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
FRONTEND_URL=http://localhost:3000
API_HOST=0.0.0.0
API_PORT=8000`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Development Commands</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium text-gray-900">Frontend</div>
                    <div className="text-sm text-gray-600 mt-1">
                      <code className="bg-white px-1 rounded">npm run dev</code> - Start development server<br/>
                      <code className="bg-white px-1 rounded">npm run build</code> - Build for production<br/>
                      <code className="bg-white px-1 rounded">npm run start</code> - Start production server<br/>
                      <code className="bg-white px-1 rounded">npm run lint</code> - Run ESLint
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium text-gray-900">Backend</div>
                    <div className="text-sm text-gray-600 mt-1">
                      <code className="bg-white px-1 rounded">uvicorn main:app --reload</code> - Start dev server<br/>
                      <code className="bg-white px-1 rounded">python main.py</code> - Start production server<br/>
                      <code className="bg-white px-1 rounded">pip install -r requirements.txt</code> - Install deps
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Deployment Options</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="font-medium text-green-900">Frontend</div>
                    <div className="text-sm text-green-700 mt-1">
                      • Vercel<br/>
                      • Netlify<br/>
                      • AWS S3 + CloudFront
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="font-medium text-blue-900">Backend</div>
                    <div className="text-sm text-blue-700 mt-1">
                      • Railway<br/>
                      • Render<br/>
                      • AWS EC2/Lambda
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="font-medium text-purple-900">Database</div>
                    <div className="text-sm text-purple-700 mt-1">
                      • Supabase (managed)<br/>
                      • AWS RDS<br/>
                      • Google Cloud SQL
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ExpandableSection>

          {/* API Documentation */}
          <ExpandableSection
            title="📖 API Documentation"
            isExpanded={expandedSections.has('api')}
            onToggle={() => toggleSection('api')}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Interactive Documentation</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800 mb-2">
                    The backend provides interactive API documentation powered by FastAPI:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>Swagger UI:</strong> <code className="bg-blue-100 px-1 rounded">/docs</code> - Interactive API explorer</li>
                    <li>• <strong>ReDoc:</strong> <code className="bg-blue-100 px-1 rounded">/redoc</code> - Alternative documentation format</li>
                    <li>• <strong>OpenAPI Schema:</strong> <code className="bg-blue-100 px-1 rounded">/openapi.json</code> - Machine-readable API spec</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Authentication Flow</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm font-bold">1</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">User Authentication</div>
                        <div className="text-sm text-gray-600">Frontend handles Supabase Auth login</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-bold">2</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">JWT Token</div>
                        <div className="text-sm text-gray-600">Access token sent in Authorization header</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 text-sm font-bold">3</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Token Validation</div>
                        <div className="text-sm text-gray-600">Backend validates JWT with Supabase</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 text-sm font-bold">4</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">User Context</div>
                        <div className="text-sm text-gray-600">User ID extracted for data isolation</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ExpandableSection>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm">
            Built with ❤️ using Next.js, FastAPI, and Supabase
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Next.js Docs
            </a>
            <a
              href="https://fastapi.tiangolo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              FastAPI Docs
            </a>
            <a
              href="https://supabase.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Supabase Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
