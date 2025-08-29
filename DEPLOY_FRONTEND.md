# Deploy Next.js Frontend to Vercel

## 🎯 Overview

Your frontend is now configured to work with your deployed backend at:
**https://backend-ya9i.onrender.com**

## 📋 What's Been Configured

### ✅ API Integration
- **`lib/api.ts`**: New utility for handling API URLs
- **Updated Components**: All API calls now use the deployed backend URL
- **Environment Detection**: Automatically uses correct API URL for dev/prod

### ✅ Next.js Configuration
- **`next.config.js`**: Updated to only proxy in development
- **`vercel.json`**: Vercel deployment configuration with environment variables

### ✅ Components Updated
- **DocumentDashboard.tsx**: All API calls updated
- **DocumentUpload.tsx**: Upload endpoint updated

## 🚀 Deploy Frontend

### Option 1: Quick Deploy (Recommended)
```bash
cd front-end
vercel --prod
```

### Option 2: Use Deploy Script
```bash
cd front-end
chmod +x deploy.sh
./deploy.sh
```

## 🔧 Environment Variables

The following environment variables are automatically configured:

- **`NEXT_PUBLIC_API_URL`**: `https://backend-ya9i.onrender.com`

### Optional Variables (Set in Vercel Dashboard)
If you're using Supabase directly in the frontend:
- **`NEXT_PUBLIC_SUPABASE_URL`**: Your Supabase project URL
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Your Supabase anonymous key

## 🧪 Testing After Deployment

Once deployed, test these features:

1. **Authentication Flow**: Login/logout functionality
2. **Document Upload**: Upload files through the UI
3. **Document Management**: View, delete, download documents
4. **API Integration**: Check browser network tab for API calls

## 🔗 Expected Architecture

```
Frontend (Vercel) ←→ Backend (Render) ←→ Supabase
Your-Frontend-URL     backend-ya9i.onrender.com     Your-Supabase-DB
```

## 📊 Key Features

- **✅ Automatic API URL Detection**: Works in dev and prod
- **✅ CORS Configured**: Backend allows frontend domain
- **✅ Security Headers**: Added security headers via Vercel
- **✅ Next.js Optimized**: Framework-specific optimizations

## 🐛 Troubleshooting

1. **API Calls Failing**: Check browser console for CORS errors
2. **404 Errors**: Verify backend URL is accessible
3. **Build Errors**: Check Next.js build output for TypeScript errors

## 🎉 Next Steps

After deployment:
1. Test the full authentication flow
2. Upload and manage documents
3. Check that all API integrations work
4. Set up any additional environment variables needed
