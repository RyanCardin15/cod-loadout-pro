# Firebase Authentication Setup Guide

## ✅ Configuration Files Created

The following environment files have been created with your Firebase credentials:

- ✅ `.env.local` (root) - Firebase Admin & Client config
- ✅ `server/.env.local` - MCP server config
- ✅ `web/.env.local` - Next.js web app config

## 🔐 Enable Authentication Providers

You need to enable OAuth providers in your Firebase Console:

### 1. Google Authentication (Primary)

1. Go to [Firebase Console](https://console.firebase.google.com/project/cod-loadout-pro/authentication/providers)
2. Click on **Google** in the Sign-in providers list
3. Click **Enable**
4. Configure:
   - **Project support email**: Choose your email
   - **Project public-facing name**: COD Loadout Pro
5. Click **Save**

**Status**: ✅ Ready to use (no additional configuration needed)

---

### 2. Twitter Authentication (Optional)

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or use existing one
3. Get your credentials:
   - **API Key**
   - **API Secret Key**
4. In Firebase Console:
   - Enable **Twitter** provider
   - Add your API Key and API Secret
   - Copy the callback URL: `https://cod-loadout-pro.firebaseapp.com/__/auth/handler`
5. In Twitter app settings:
   - Add callback URL
   - Enable "Request email from users"
6. Click **Save** in Firebase

---

### 3. Discord Authentication (Gaming Community)

Discord requires custom OIDC configuration in Firebase:

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or use existing
3. Navigate to **OAuth2** section
4. Get your credentials:
   - **Client ID**
   - **Client Secret**
5. Add redirect URI:
   ```
   https://cod-loadout-pro.firebaseapp.com/__/auth/handler
   ```
6. In Discord OAuth2 settings:
   - Select scopes: `identify`, `email`

7. In Firebase Console:
   - Go to Authentication > Sign-in method
   - Scroll to **Add new provider**
   - Select **OpenID Connect**
   - Configure:
     - **Name**: Discord
     - **Client ID**: Your Discord Client ID
     - **Issuer**: `https://discord.com/api`
     - **Client Secret**: Your Discord Client Secret
   - Click **Save**

---

## 🌐 Configure Authorized Domains

1. In Firebase Console, go to **Authentication > Settings > Authorized domains**
2. Add your domains:
   - ✅ `localhost` (for development - already added)
   - ✅ `cod-loadout-pro.firebaseapp.com` (already added)
   - Add your Vercel domain when deployed:
     - `cod-loadout-pro.vercel.app`
     - `your-custom-domain.com` (if applicable)

---

## 🗄️ Firestore Database Setup

Your Firestore is already configured with security rules in `firebase/firestore.rules`.

### Create Required Collections

The app will auto-create collections, but you can manually verify:

1. Go to [Firestore Database](https://console.firebase.google.com/project/cod-loadout-pro/firestore)
2. Ensure these collections exist (will be created automatically):
   - `users` - User profiles
   - `loadouts` - Saved loadouts
   - `weapons` - Weapon data
   - `attachments` - Attachment data
   - `perks` - Perks data
   - `equipment` - Equipment data
   - `meta_snapshots` - Meta tier data

---

## 🧪 Test Authentication

### Local Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open browser to `http://localhost:3000`

3. Click **Sign in with Google**

4. Complete the OAuth flow

5. Check Firestore Console - you should see a new document in the `users` collection

### Test Profile Features

1. After signing in, navigate to `/profile`
2. Update your playstyle preferences
3. Select your games
4. Check that changes save successfully

---

## 🔧 Troubleshooting

### Google Sign-In Not Working

- **Error**: "This app is blocked"
  - **Solution**: In Firebase Console, make sure OAuth consent screen is configured
  - Go to Google Cloud Console > APIs & Services > OAuth consent screen
  - Add your email as a test user if app is in testing mode

### Redirect URI Mismatch

- **Error**: "redirect_uri_mismatch"
  - **Solution**: Make sure authorized redirect URIs are set in OAuth provider settings
  - For Google: URIs are auto-configured by Firebase
  - For Twitter/Discord: Double-check callback URL matches exactly

### CORS Errors

- **Error**: "CORS policy: No 'Access-Control-Allow-Origin' header"
  - **Solution**: Make sure your domain is added to Firebase authorized domains
  - Check `firebase/firestore.rules` for proper CORS configuration

### Profile Not Creating

- **Error**: Profile doesn't appear in Firestore
  - **Solution**: Check Firestore security rules allow user creation
  - Verify `useProfile` hook is being called on authenticated pages
  - Check browser console for errors

---

## 📊 Monitor Authentication

### Firebase Console

1. Go to [Authentication Dashboard](https://console.firebase.google.com/project/cod-loadout-pro/authentication/users)
2. View authenticated users
3. Check sign-in methods usage
4. Monitor authentication events

### Firestore Console

1. Go to [Firestore Database](https://console.firebase.google.com/project/cod-loadout-pro/firestore/data/users)
2. Browse `users` collection
3. Verify user profiles are created correctly
4. Check playstyle preferences are saving

---

## ✅ Verification Checklist

Before deploying to production:

- [ ] Google sign-in enabled and tested
- [ ] Twitter sign-in configured (optional)
- [ ] Discord sign-in configured (optional)
- [ ] Authorized domains added
- [ ] Firestore security rules deployed
- [ ] Local authentication tested
- [ ] Profile creation working
- [ ] Profile updates working
- [ ] Environment variables set in Vercel

---

## 🚀 Next Steps

1. **Enable Google Sign-In** (Required) - Takes 2 minutes
2. **Test Locally** - Verify authentication works
3. **Optional Providers** - Add Twitter/Discord later
4. **Deploy to Vercel** - Set environment variables

Once Google sign-in is enabled, you can start using the app immediately!

---

## 📝 Notes

- Your Firebase project ID: `cod-loadout-pro`
- Your app is configured for both web and MCP server authentication
- All authentication credentials are stored in `.env.local` files
- **Never commit `.env.local` files to git** (already in `.gitignore`)

---

## 🆘 Need Help?

If you encounter issues:

1. Check Firebase Console error logs
2. Check browser console for client errors
3. Check server logs for backend errors
4. Verify all environment variables are set correctly
5. Ensure Firebase Admin SDK credentials are valid
