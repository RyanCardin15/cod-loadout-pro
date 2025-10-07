# Firestore Setup & Troubleshooting

## ✅ Security Rules Deployed

The Firestore security rules have been successfully deployed to your Firebase project `cod-loadout-pro`.

### Security Rules Summary

The deployed rules allow:
- **Users**: Authenticated users can read/write their own profile (`/users/{userId}`)
- **Loadouts**: Users can read/write their own loadouts
- **Public Data**: Anyone can read weapons and attachments (write disabled)

## 🔍 Troubleshooting "Missing or insufficient permissions"

If you're still seeing this error, try these steps:

### 1. Check Browser Console
Open the browser developer console (F12) and look for detailed error messages with these prefixes:
- `[Firebase]` - Initialization logs
- `[AuthContext]` - Authentication state
- `[useAuth]` - Auth operations
- `[useProfile]` - Profile data fetching

### 2. Verify Authentication
Make sure you're signed in. Check the console for:
```
[AuthContext] Auth state changed: { hasUser: true, userId: "...", ... }
```

If `hasUser: false`, you need to sign in first.

### 3. Clear Cache & Reload
```bash
# Clear browser cache or use incognito mode
# Then refresh the page
```

### 4. Check Firestore Rules in Console
Visit: https://console.firebase.google.com/project/cod-loadout-pro/firestore/rules

Ensure the rules show:
```
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null && request.auth.uid == userId;
  ...
}
```

### 5. Verify Firebase Config
Ensure these environment variables are set in `web/.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cod-loadout-pro
```

### 6. Test Firestore Connection
Open browser console and run:
```javascript
// Check if user is authenticated
console.log('User:', auth.currentUser);

// Check if Firestore is accessible
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from './src/lib/firebase';

if (auth.currentUser) {
  const docRef = doc(db, 'users', auth.currentUser.uid);
  getDoc(docRef).then(snap => {
    console.log('Profile exists:', snap.exists());
    console.log('Profile data:', snap.data());
  }).catch(err => {
    console.error('Firestore error:', err);
  });
}
```

## 🚀 Redeploy Rules (if needed)

If you make changes to `firestore.rules`, redeploy with:

```bash
cd web
firebase deploy --only firestore:rules --project cod-loadout-pro
```

## 📊 Expected Console Output

When everything works correctly, you should see:

```
[Firebase] Initializing with config: { projectId: "cod-loadout-pro", ... }
[Firebase] App initialized: [DEFAULT]
[Firebase] Services initialized: { hasDb: true, hasAuth: true, hasStorage: true }
[AuthContext] Setting up auth state listener
[AuthContext] Auth state changed: { hasUser: true, userId: "abc123...", ... }
[useProfile] Query function called { hasUser: true, userId: "abc123...", ... }
[useProfile] Fetching profile from Firestore for user: abc123...
[useProfile] Profile found: { userId: "abc123...", ... }
```

## 🔒 Security Notes

- Users can only access their own data
- All operations require authentication
- Profile creation is automatic on first sign-in
- No public write access to prevent abuse

## 📞 Still Having Issues?

Check the browser console for detailed error messages and share them for further troubleshooting. The logging has been enhanced to show exactly where the failure occurs.
