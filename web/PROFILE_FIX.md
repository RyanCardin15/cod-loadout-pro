# Profile Permission Fix - Quick Reference

## ✅ What Was Done

1. **Created Firestore Security Rules** (`firestore.rules`)
   - Allows authenticated users to read/write their own profile
   - Users collection: `/users/{userId}` - owned by user
   - Loadouts collection: `/loadouts/{loadoutId}` - owned by user

2. **Deployed Rules to Firebase**
   ```bash
   firebase deploy --only firestore:rules --project cod-loadout-pro
   ```
   Status: ✅ **Successfully Deployed**

3. **Enhanced Error Handling**
   - Better error messages in the UI
   - Detailed console logging
   - Helpful troubleshooting hints

## 🔄 Next Steps

### Wait 1-2 Minutes
Firestore rules can take a moment to propagate. Wait 1-2 minutes, then:

1. **Refresh the page** (hard reload: Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. **Check if you're signed in** - look for your avatar in the top right
3. **Navigate to profile** at `/profile`

### If Still Not Working

**Check Browser Console (F12)**
Look for logs starting with:
- `[Firebase]` - Shows Firebase initialization
- `[AuthContext]` - Shows authentication state
- `[useProfile]` - Shows profile loading attempts

Expected successful flow:
```
[Firebase] Initializing with config...
[AuthContext] Auth state changed: { hasUser: true, userId: "..." }
[useProfile] Query function called { hasUser: true, ... }
[useProfile] Fetching profile from Firestore...
[useProfile] Profile found (or created)
```

**Common Issues:**

1. **Not Signed In**
   - Error: `[useProfile] No user, returning null`
   - Fix: Click "Sign In" and authenticate with Google/Twitter/Discord

2. **Rules Not Propagated Yet**
   - Error: `Missing or insufficient permissions`
   - Fix: Wait 1-2 minutes and retry

3. **Wrong User ID**
   - Check console for userId mismatches
   - Sign out and sign in again

## 📋 Files Changed

- ✅ `firestore.rules` - Security rules (deployed)
- ✅ `firebase.json` - Firebase config
- ✅ `firestore.indexes.json` - Database indexes
- ✅ `src/app/profile/page.tsx` - Enhanced error UI
- ✅ `src/hooks/useProfile.ts` - Better error logging
- ✅ `src/hooks/useAuth.ts` - Auth state logging
- ✅ `src/contexts/AuthContext.tsx` - Auth context logging
- ✅ `src/lib/firebase.ts` - Firebase init logging

## 🧪 Test the Fix

1. Open browser console (F12)
2. Navigate to `/profile`
3. Watch the console logs
4. If error appears, check:
   - Are you signed in? (look for user avatar)
   - What does the error say exactly?
   - Share the console logs if needed

## 🔗 Helpful Links

- [Firebase Console - Firestore Rules](https://console.firebase.google.com/project/cod-loadout-pro/firestore/rules)
- [Firebase Console - Authentication](https://console.firebase.google.com/project/cod-loadout-pro/authentication/users)
- [Firebase Console - Firestore Data](https://console.firebase.google.com/project/cod-loadout-pro/firestore/data)

## 💡 Tips

- Use browser incognito mode to test with a fresh session
- Clear browser cache if issues persist
- Check that environment variables are loaded (restart dev server)
- Firestore rules are case-sensitive: userId must match exactly

---

**Status**: Rules deployed successfully. The profile page should work after 1-2 minutes for rules propagation.
