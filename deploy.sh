#!/bin/bash

# Deploy Next.js Frontend to Vercel
echo "🚀 Deploying Next.js Frontend to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy to production
echo "📦 Deploying to production..."
vercel --prod

echo "✅ Frontend deployment complete!"
echo ""
echo "🔗 Your frontend should now be live and connected to:"
echo "   Backend API: https://backend-theta-dusky-43.vercel.app"
echo ""
echo "📝 Optional: Set additional environment variables in Vercel dashboard:"
echo "   - NEXT_PUBLIC_SUPABASE_URL (if using Supabase on frontend)"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY (if using Supabase on frontend)"
