# Quick Start Guide

## 🎉 Setup Complete!

All authentication and profile features have been implemented and the build is successful. Here's how to get started:

---

## ✅ What's Already Done

- ✅ Firebase credentials configured
- ✅ Environment files created (`.env.local`)
- ✅ Authentication components built
- ✅ Profile system implemented
- ✅ MCP tools created
- ✅ Build passing

---

## 🚀 Start the Development Server

```bash
# From the root directory
npm run dev
```

This will start both the web app and MCP server:
- **Web App**: http://localhost:3000
- **MCP Server**: http://localhost:3001 (or configured port)

---

## 🔐 Enable Google Sign-In (2 Minutes)

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/project/cod-loadout-pro/authentication/providers
2. You should already be logged in to your Firebase account

### Step 2: Enable Google Provider
1. Click on **Google** in the sign-in providers list
2. Click the **Enable** toggle
3. Select your support email from the dropdown
4. Click **Save**

That's it! Google authentication is now enabled.

---

## 🧪 Test Authentication

### 1. Open the App
```bash
npm run dev
```
Navigate to: http://localhost:3000

### 2. Sign In
- Click the **"Sign in with Google"** button in the navigation
- Complete the Google OAuth flow
- You should be redirected back to the app

### 3. Verify Profile Creation
1. Go to Firebase Console > Firestore Database
2. Open the `users` collection
3. You should see your new user document

### 4. Test Profile Page
- Navigate to: http://localhost:3000/profile
- Update your playstyle preferences
- Select your games
- Changes should save automatically

---

## 📁 Project Structure

```
Counterplay/
├── web/                    # Next.js web application
│   ├── src/
│   │   ├── app/           # App routes
│   │   │   ├── (landing)/ # Landing page
│   │   │   └── profile/   # Profile page
│   │   ├── components/    # React components
│   │   │   ├── auth/      # Auth components
│   │   │   └── profile/   # Profile components
│   │   ├── contexts/      # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/         # Custom hooks
│   │   │   ├── useAuth.ts
│   │   │   └── useProfile.ts
│   │   └── lib/
│   │       ├── firebase.ts    # Firebase client config
│   │       └── api-client.ts
│   └── .env.local         # Web environment vars
│
├── server/                 # MCP Server
│   ├── src/
│   │   ├── tools/         # MCP tools
│   │   │   ├── get-my-profile.ts
│   │   │   ├── update-profile.ts
│   │   │   └── profile-stats.ts
│   │   ├── services/      # Business logic
│   │   │   └── user-service.ts
│   │   ├── middleware/    # Auth middleware
│   │   │   └── auth.ts
│   │   └── firebase/
│   │       └── admin.ts   # Firebase admin config
│   └── .env.local         # Server environment vars
│
├── api/                    # Vercel API endpoints
│   └── oauth/
│       └── callback.ts     # OAuth2 callback
│
├── firebase/               # Firebase configuration
│   ├── firestore.rules    # Security rules
│   └── firebase-admin-key.json
│
├── .env.local             # Root environment vars
└── .env.example           # Example env vars
```

---

## 🎯 Key Features

### Authentication
- ✅ Google OAuth (Enabled, ready to test)
- ⏳ Twitter OAuth (Configure when needed)
- ⏳ Discord OAuth (Configure when needed)

### Profile Management
- ✅ User profiles with Firestore
- ✅ Playstyle preferences
- ✅ Game preferences
- ✅ Activity tracking
- ✅ Stats dashboard

### UI Components
- ✅ SignInButton - OAuth sign-in
- ✅ AuthModal - Sign-in modal
- ✅ UserMenu - User dropdown
- ✅ ProtectedRoute - Route protection
- ✅ Profile page with full editor

### MCP Tools
- ✅ `get_my_profile` - Get user profile
- ✅ `update_profile` - Update preferences
- ✅ `profile_stats` - Get user stats

---

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

## 📊 Check Your Setup

### ✅ Environment Variables
```bash
# Check web environment
cat web/.env.local

# Check server environment
cat server/.env.local
```

### ✅ Firebase Console
- Authentication: https://console.firebase.google.com/project/cod-loadout-pro/authentication
- Firestore: https://console.firebase.google.com/project/cod-loadout-pro/firestore
- Settings: https://console.firebase.google.com/project/cod-loadout-pro/settings/general

---

## 🔧 Troubleshooting

### Can't Sign In?
1. Make sure Google provider is enabled in Firebase Console
2. Check browser console for errors
3. Verify environment variables in `web/.env.local`

### Profile Not Saving?
1. Check Firestore rules are deployed: `firebase deploy --only firestore:rules`
2. Verify user is authenticated (check Network tab)
3. Check server logs for errors

### Build Failing?
```bash
# Clear cache and rebuild
rm -rf web/.next
cd web && npm run build
```

---

## 🚀 Next Steps

### Optional: Add More OAuth Providers

#### Twitter
See: `FIREBASE_SETUP.md` > Section 2

#### Discord
See: `FIREBASE_SETUP.md` > Section 3

### Deploy to Vercel

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - (and all other env vars from `.env.example`)
3. Deploy!

---

## 📚 Documentation

- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Firebase Setup Guide**: `FIREBASE_SETUP.md`
- **This Quick Start**: `QUICK_START.md`

---

## 🎉 You're Ready!

Your authentication system is fully set up and ready to use. Just enable Google sign-in in Firebase Console and you're good to go!

**Time to first working sign-in: ~2 minutes** ⚡️
